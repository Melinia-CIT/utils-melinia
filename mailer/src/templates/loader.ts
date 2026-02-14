import { promises as fs } from 'fs';
import path from 'path';

interface LoadedTemplate {
  template: string;
  subject: string;
}

export async function loadTemplate(name: string): Promise<LoadedTemplate> {
  const templatePath = path.join('./templates', `${name}.pug`);
  const content = await fs.readFile(templatePath, 'utf-8');

  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
  const template = frontmatterMatch ? content.slice(frontmatterMatch[0].length) : content;

  const subjectMatch = frontmatter.match(/^subject:\s*(.+)$/m);
  const subject = subjectMatch ? subjectMatch[1].trim() : 'No Subject';

  return { template, subject };
}
