import { CLIArgs } from '../types.ts';

export function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  
  const templateIndex = args.indexOf('--template');
  const dataIndex = args.indexOf('--data');

  if (templateIndex === -1 || dataIndex === -1) {
    throw new Error('Missing required arguments: --template and --data');
  }

  const template = args[templateIndex + 1];
  const data = args[dataIndex + 1];

  if (!template || !data) {
    throw new Error('Missing values for --template or --data');
  }

  return { template, data };
}
