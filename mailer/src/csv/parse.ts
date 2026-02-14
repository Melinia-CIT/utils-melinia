import { parse } from 'csv-parse/sync';
import { promises as fs } from 'fs';
import { type Recipient } from '../types.ts';

export async function parseCSV(filePath: string): Promise<Recipient[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  }) as Record<string, unknown>[];

  return records.map((record, index) => {
    if (!record.email) {
      throw new Error(`Row ${index + 1}: missing required field 'email'`);
    }
    return record as Recipient;
  });
}
