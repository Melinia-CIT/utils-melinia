import { promises as fs } from 'fs';
import { parse } from 'yaml';
import { Config } from '../types.ts';

export async function loadConfig(): Promise<Config> {
  const content = await fs.readFile('./smtp.yaml', 'utf-8');
  const config = parse(content);
  return config as Config;
}
