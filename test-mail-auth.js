import nodemailer from 'nodemailer';

async function testMail() {
  console.log("Testing Nodemailer with credentials:");
  console.log("GMAIL_USER:", process.env.GMAIL_USER ? "Filled" : "Missing");
  console.log("GMAIL_APP_PASS:", process.env.GMAIL_APP_PASSWORD ? "Filled" : "Missing");

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error("Missing credentials in .env");
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  try {
    const info = await transporter.sendMail({
      from: `"JK Restaurant" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER, // send to self
      subject: "Test Email Setup",
      text: "If you see this, nodemailer is working perfectly."
    });
    console.log("SUCCESS! Email sent.", info.messageId);
  } catch (error) {
    console.error("FAILED TO SEND EMAIL:", error);
  }
}

testMail();
