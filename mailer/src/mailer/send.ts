import type Transport from 'nodemailer/lib/mailer';

export async function sendEmail(transport: Transport, email: { from: string; to: string; subject: string; html: string }): Promise<void> {
  await transport.sendMail(email);
}
