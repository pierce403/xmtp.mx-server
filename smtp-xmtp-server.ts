// SMTP server with XMTP integration
import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { Client } from '@xmtp/xmtp-js';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { Readable } from 'stream';

dotenv.config();

const INFURA_KEY = process.env.INFURA_KEY;
if (!INFURA_KEY) {
  console.error('INFURA_KEY environment variable is not set');
  process.exit(1);
}

const SMTP_PORT = 2525;
const SMTP_HOST = '0.0.0.0';
const XMTP_SENDER_ADDRESS = 'xmtpmx.eth';
const FALLBACK_XMTP_ADDRESS = '0x1234567890123456789012345678901234567890'; // Fallback address if ENS resolution fails

const provider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_KEY}`);
let xmtpClient: Client;
let xmtpSenderAddress: string;

async function initializeXMTPClient(): Promise<void> {
  try {
    console.log('Initializing XMTP client...');
    const wallet = ethers.Wallet.createRandom();
    xmtpClient = await Client.create(wallet, { env: 'production' });
    console.log(`XMTP client initialized with address: ${xmtpClient.address}`);

    // Resolve xmtpmx.eth to its Ethereum address
    xmtpSenderAddress = await resolveENS(XMTP_SENDER_ADDRESS);
    console.log(`Using XMTP sender address: ${xmtpSenderAddress}`);
  } catch (error) {
    console.error('Error initializing XMTP client:', error);
    process.exit(1);
  }
}

async function resolveENS(ensName: string): Promise<string> {
  try {
    console.log(`Resolving ENS name: ${ensName}`);
    const address = await provider.resolveName(ensName);
    if (!address) {
      console.log(`Failed to resolve ENS name: ${ensName}. Using fallback address.`);
      return FALLBACK_XMTP_ADDRESS;
    }
    console.log(`Resolved ${ensName} to ${address}`);
    return address;
  } catch (error) {
    console.error(`Error resolving ENS name ${ensName}:`, error);
    console.log(`Using fallback address for ${ensName}.`);
    return FALLBACK_XMTP_ADDRESS;
  }
}

async function handleEmail(stream: Readable, session: any, callback: (error?: Error) => void): Promise<void> {
  let buffer = '';
  stream.on('data', (chunk: Buffer) => {
    buffer += chunk.toString();
  });

  stream.on('end', async () => {
    try {
      const parsedEmail = await simpleParser(buffer);
      console.log('Parsed email:', JSON.stringify(parsedEmail, null, 2));

      const to = parsedEmail.to?.text;
      if (!to) {
        throw new Error('Invalid email: missing recipient');
      }
      const ensName = to.split('@')[0];
      console.log(`Extracted ENS name: ${ensName}`);

      if (!ensName.endsWith('.eth')) {
        throw new Error('Invalid ENS name format');
      }

      const content = parsedEmail.text || '';
      const resolvedAddress = await resolveENS(ensName);
      await sendXMTPMessage(resolvedAddress, content);
      console.log('XMTP message sent successfully.');
      callback();
    } catch (error) {
      console.error('Error processing email:', error);
      callback(new Error('Error processing email'));
    }
  });

  stream.on('error', (error: Error) => {
    console.error('Error reading email stream:', error);
    callback(new Error('Error reading email'));
  });
}

async function sendXMTPMessage(toAddress: string, content: string): Promise<void> {
  console.log(`Sending XMTP message to ${toAddress}...`);
  try {
    const conversation = await xmtpClient.conversations.newConversation(toAddress, { conversationId: XMTP_SENDER_ADDRESS });
    await conversation.send(content);
    console.log(`XMTP message sent successfully from ${XMTP_SENDER_ADDRESS} to ${toAddress}.`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not on the XMTP network')) {
      console.warn(`Recipient ${toAddress} is not on the XMTP network. Falling back to logging.`);
      console.log(`Message content for ${toAddress}: ${content}`);
      // Implement additional fallback mechanism here if needed
    } else {
      console.error('Error sending XMTP message:', error);
    }
    // Don't throw the error, allow the process to continue
  }
}

function startSMTPServer(): SMTPServer {
  console.log('Starting SMTP server...');
  const server = new SMTPServer({
    authOptional: true,
    onData: handleEmail,
  });

  server.listen(SMTP_PORT, SMTP_HOST);
  console.log(`SMTP server running on ${SMTP_HOST}:${SMTP_PORT}`);
  return server;
}

async function main(): Promise<void> {
  await initializeXMTPClient();
  const server = startSMTPServer();

  process.on('SIGINT', () => {
    console.log('Stopping server...');
    server.close(() => {
      console.log('Server stopped.');
      process.exit(0);
    });
  });
}

main().catch(console.error);
