import { Config, SMTPConfig } from '../types.ts';

export function validateConfig(config: unknown): Config {
  if (!config || typeof config !== 'object') {
    throw new Error('Invalid config: must be an object');
  }

  const smtp = config as SMTPConfig;

  if (!smtp.host) throw new Error('Missing required field: host');
  if (!smtp.port) throw new Error('Missing required field: port');
  if (typeof smtp.secure !== 'boolean') throw new Error('Missing required field: secure');
  if (!smtp.auth) throw new Error('Missing required field: auth');
  if (!smtp.auth.user) throw new Error('Missing required field: auth.user');
  if (!smtp.auth.pass) throw new Error('Missing required field: auth.pass');
  if (!smtp.from) throw new Error('Missing required field: from');

  return smtp as Config;
}
