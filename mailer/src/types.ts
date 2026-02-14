export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  rate_limit?: {
    emails_per_second?: number;
  };
}

export interface Config extends SMTPConfig {}

export interface Recipient {
  email: string;
  [key: string]: unknown;
}

export interface CLIArgs {
  template: string;
  data: string;
}
