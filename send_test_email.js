const nodemailer = require('nodemailer');

async function sendTestEmail() {
  // Create a test account
  let testAccount = await nodemailer.createTestAccount();

  // Create a transporter using the test SMTP server
  let transporter = nodemailer.createTransport({
    host: "localhost",
    port: 2525,
    secure: false, // Use TLS
    tls: {
      rejectUnauthorized: false // Accept self-signed certificates
    }
  });

  // Send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Test Sender" <test@example.com>',
    to: "namegoeshere.eth@xmtp.mx",
    subject: "Test Email",
    text: "This is a test email sent to the SMTP server.",
    html: "<b>This is a test email sent to the SMTP server.</b>"
  });

  console.log("Message sent: %s", info.messageId);
}

sendTestEmail().catch(console.error);
