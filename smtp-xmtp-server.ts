import { Client } from '@xmtp/xmtp-js';
import { Wallet } from 'ethers';
import * as dotenv from 'dotenv';
import formData from 'form-data';
import Mailgun from 'mailgun.js';

dotenv.config();

const XMTP_PRIVATE_KEY = process.env.XMTP_PRIVATE_KEY || '';
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || '';
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || '';

const mailgun = new Mailgun(formData);
const mg = mailgun.client({ username: 'api', key: MAILGUN_API_KEY });

async function initializeXMTPClient(): Promise<Client> {
  const wallet = new Wallet(XMTP_PRIVATE_KEY);
  return await Client.create(wallet, { env: 'production' });
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

async function main() {
  const xmtp = await initializeXMTPClient();
  console.log('XMTP client initialized');

  // Send startup message
  await sendEmail('deanpierce.eth', 'XMTP-MX Server Starting', 'The XMTP-MX Server is now starting up.');

  const stream = await xmtp.conversations.stream();
  console.log('Listening for new XMTP messages...');

  for await (const conversation of stream) {
    for await (const message of await conversation.streamMessages()) {
      console.log(`New message from ${message.senderAddress}: ${message.content}`);
      await handleIncomingXMTPMessage(message);
    }
  }
}
