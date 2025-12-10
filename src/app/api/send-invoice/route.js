import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import pRetry from 'p-retry';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: "asamavictor225@gmail.com",
    pass: "lzdifpeuimnnajgz",
  },
  connectionTimeout: 30_000,
  greetingTimeout: 30_000,
  socketTimeout: 60_000,
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const customerEmail = formData.get('customer_email');
    const customerName = formData.get('customer_name');
    const orderNumber = formData.get('order_number');
    const totalAmount = formData.get('total_amount');
    const pdfFile = formData.get('invoice_pdf');

    if (!customerEmail || !pdfFile) {
      return NextResponse.json(
        { status: 'error', message: 'Missing email or PDF' },
        { status: 400 }
      );
    }

    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());

    await pRetry(
      () =>
        transporter.sendMail({
          from: '"Badij Technologies" <sales@madisonjayng.com>',
          to: customerEmail,
          subject: `Invoice #${orderNumber} – ₦${Number(totalAmount).toLocaleString()}`,
          html: `
            <h2>Dear ${customerName},</h2>
            <p>Thank you for your order! Your invoice is attached.</p>
            <p><strong>Order #:</strong> ${orderNumber}</p>
            <p><strong>Total:</strong> ₦${Number(totalAmount).toLocaleString()}</p>
            <p>Best regards,<br/>Badij Technologies</p>
          `,
          attachments: [
            {
              filename: `invoice_${orderNumber}.pdf`,
              content: pdfBuffer,
            },
          ],
        }),
      {
        retries: 3,
        onFailedAttempt: (error) => {
          console.warn(`Email retry ${error.attemptNumber} failed: ${error.message}`);
        },
      }
    );

    return NextResponse.json({ status: 'success', message: 'Email sent' });
  } catch (error) {
    console.error('Nodemailer error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}