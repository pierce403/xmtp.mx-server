import { Client } from '@xmtp/xmtp-js';
import { Wallet } from 'ethers';
import * as dotenv from 'dotenv';
import Mailgun from 'mailgun.js';
import formData from 'form-data';

// Load environment variables
dotenv.config();

console.log('Environment variables:', process.env);

const XMTP_PRIVATE_KEY = process.env.XMTP_PRIVATE_KEY || '';
if (!XMTP_PRIVATE_KEY) {
  throw new Error('XMTP_PRIVATE_KEY is not set in the environment');
}
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || '';
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || '';
if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
  throw new Error('MAILGUN_API_KEY or MAILGUN_DOMAIN is not set in the environment');
}
const TEST_RECIPIENT = 'test.eth@xmtp.mx';
const XMTP_TEST_RECIPIENT = '0xAA6d8044dc40d99FC420CA398477f89C870F4747'; // New test recipient address

const mailgun = new Mailgun(formData);
const mg = mailgun.client({ username: 'api', key: MAILGUN_API_KEY });

async function testXMTPIntegration() {
  const wallet = new Wallet(XMTP_PRIVATE_KEY);
  const xmtp = await Client.create(wallet, { env: 'dev' }); // Use 'dev' environment for testing

  console.log('Testing XMTP message processing...');

  // Ensure the test recipient is on the XMTP network
  const isOnNetwork = await xmtp.canMessage(XMTP_TEST_RECIPIENT);
  if (!isOnNetwork) {
    console.log('Test recipient is not on the XMTP network. Attempting to create a client for the test recipient...');
    const testRecipientWallet = new Wallet('0xe94ffe675da5f50e5bbe399e0a82dc37399e562e0832a36fa9f0db360daa1f21');
    await Client.create(testRecipientWallet, { env: 'dev' });
    console.log('Client created for test recipient.');
  }

  const conversation = await xmtp.conversations.newConversation(XMTP_TEST_RECIPIENT);
  await conversation.send(`To: ${TEST_RECIPIENT}\nSubject: Test Subject\n\nThis is a test message body.`);
  console.log('Test message sent. Check Mailgun logs for outgoing email.');

  console.log('Testing error handling...');
  await conversation.send(`To: invalid.address\nSubject: Invalid Test\n\nThis should trigger an error.`);
  console.log('Error test message sent. Check for error notifications.');

  console.log('Testing outgoing email via Mailgun...');
  try {
    const result = await mg.messages.create(MAILGUN_DOMAIN, {
      from: `XMTP-MX Server <noreply@${MAILGUN_DOMAIN}>`,
      to: [TEST_RECIPIENT],
      subject: 'Mailgun Test',
      text: 'This is a test email sent directly via Mailgun.',
    });
    console.log('Test email sent via Mailgun:', result);
  } catch (error) {
    console.error('Error sending email via Mailgun:', error);
  }
}

testXMTPIntegration().catch(console.error);
