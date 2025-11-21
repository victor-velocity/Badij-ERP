import { NextResponse } from 'next/server';
import emailjs from '@emailjs/nodejs';

emailjs.init({
  publicKey: process.env.EMAILJS_PUBLIC_KEY,
  privateKey: process.env.EMAILJS_PRIVATE_KEY,
});

export async function POST(request) {
  try {
    const { email, fullName, temporaryPassword, role, position, department } =
      await request.json();

    if (!email || !fullName || !temporaryPassword) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const roleDisplay =
      role === 'user' ? 'Employee' :
      role === 'manager' ? 'Manager' :
      role.charAt(0).toUpperCase() + role.slice(1);

    const templateParams = {
      to_email: email,
      to_name: fullName,
      role: roleDisplay,
      position: position || 'N/A',
      department: department || 'To be assigned',
      temporary_password: temporaryPassword,
      login_url: 'https://yourdomain.com/login',
      company_name: 'Madison Jay',
      year: new Date().getFullYear(),
    };

    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('EmailJS error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error.text || error.message },
      { status: 500 }
    );
  }
}