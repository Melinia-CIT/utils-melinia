import nodemailer from 'nodemailer';
import { type SMTPConfig } from '../types.ts';

export function createTransport(config: SMTPConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.auth.user,
      pass: config.auth.pass
    }
  });
}
