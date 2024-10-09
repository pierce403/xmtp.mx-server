import { Client } from '@xmtp/xmtp-js';
import { Wallet } from 'ethers';
import * as dotenv from 'dotenv';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { ethers } from 'ethers';

dotenv.config();

const INFURA_KEY = process.env.INFURA_KEY;
if (!INFURA_KEY) {
  console.error('INFURA_KEY environment variable is not set');
  process.exit(1);
}

const XMTP_PRIVATE_KEY = process.env.XMTP_PRIVATE_KEY || '';
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || '';
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || '';
const XMTP_SENDER_ADDRESS = 'xmtpmx.eth';
const FALLBACK_XMTP_ADDRESS = '0x1234567890123456789012345678901234567890'; // Fallback address if ENS resolution fails

const provider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_KEY}`);
let xmtpClient: Client;
let xmtpSenderAddress: string;

const mailgun = new Mailgun(formData);
const mg = mailgun.client({ username: 'api', key: MAILGUN_API_KEY });

async function initializeXMTPClient(): Promise<Client> {
  console.log('Initializing XMTP client...');
  const wallet = new Wallet(XMTP_PRIVATE_KEY);
  console.log(`Wallet address: ${wallet.address}`);
  xmtpClient = await Client.create(wallet, { env: 'production' });
  console.log(`XMTP client created for address: ${xmtpClient.address}`);
  return xmtpClient;
}

async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  try {
    await mg.messages.create(MAILGUN_DOMAIN, {
      from: `XMTP-MX Server <noreply@${MAILGUN_DOMAIN}>`,
      to: [to],
      subject: subject,
      text: body,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

async function parseXMTPMessage(content: string): Promise<{ to: string; subject: string; body: string }> {
  const lines = content.split('\n');
  let to = '';
  let subject = '';
  let body = '';
  let isBody = false;

  for (const line of lines) {
    if (line.startsWith('To:')) {
      to = line.substring(3).trim();
    } else if (line.startsWith('Subject:')) {
      subject = line.substring(8).trim();
    } else if (line.trim() === '') {
      isBody = true;
    } else if (isBody) {
      body += line + '\n';
    }
  }

  if (!to || !to.endsWith('.eth')) {
    throw new Error('Invalid or missing "to" address in the XMTP message');
  }

  return { to, subject, body: body.trim() };
}

async function handleIncomingXMTPMessage(message: any): Promise<void> {
  try {
    const { to, subject, body } = await parseXMTPMessage(message.content);
    await sendEmail(to, subject, body);
  } catch (error) {
    console.error('Error processing XMTP message:', error);
    await sendErrorNotification(error as Error, 'deanpierce.eth');
    if (message.senderAddress) {
      await sendErrorNotification(error as Error, message.senderAddress);
    }
  }
}

async function sendErrorNotification(error: Error, to: string): Promise<void> {
  const subject = 'Error processing your message';
  const body = `An error occurred while processing your message: ${error.message}`;
  try {
    await sendEmail(to, subject, body);
  } catch (emailError) {
    console.error(`Failed to send error notification to ${to}:`, emailError);
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
async function sendXMTPMessage(toAddress: string, content: string): Promise<void> {
  // make sure to resolve the ENS name to an XMTP address
  toAddress = await resolveENS(toAddress);
  console.log(`Sending XMTP message to ${toAddress}...`);
  try {
    const conversation = await xmtpClient.conversations.newConversation(toAddress);
    await conversation.send(content);
    console.log(`XMTP message sent successfully from ${XMTP_SENDER_ADDRESS} to ${toAddress}.`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not on the XMTP network')) {
      console.warn(`Recipient ${toAddress} is not on the XMTP network. Message not sent.`);
    } else {
      console.error('Error sending XMTP message:', error);
    }
    // Don't throw the error, allow the process to continue
  }
}

async function main() {
  console.log('Starting XMTP-MX Server...');

  if (!XMTP_PRIVATE_KEY) {
    console.error('XMTP_PRIVATE_KEY is not set in the environment variables.');
    process.exit(1);
  }

  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    console.error('MAILGUN_API_KEY or MAILGUN_DOMAIN is not set in the environment variables.');
    process.exit(1);
  }

  try {
    xmtpClient = await initializeXMTPClient();
    console.log('XMTP client initialized successfully');

    // Send startup message via XMTP
    console.log('Sending startup notification via XMTP...');
    await sendXMTPMessage('deanpierce.eth', 'The XMTP-MX Server is now starting up.');
    console.log('Startup notification sent via XMTP');

    console.log('Setting up message stream...');
    const stream = await xmtpClient.conversations.stream();
    console.log('Message stream set up. Listening for new XMTP messages...');

    for await (const conversation of stream) {
      console.log(`New conversation with ${conversation.peerAddress}`);
      for await (const message of await conversation.streamMessages()) {
        console.log(`New message from ${message.senderAddress}: ${message.content}`);
        await handleIncomingXMTPMessage(message);
      }
    }
  } catch (error) {
    console.error('An error occurred in the main function:', error);
  }
}

console.log('XMTP-MX Server script loaded. Calling main function...');
main().catch((error) => {
  console.error('Unhandled error in main function:', error);
  process.exit(1);
});
