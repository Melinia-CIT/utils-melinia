import { render } from 'pug';

export function renderTemplate(template: string, recipientData: Record<string, unknown>): string {
  return render(template, recipientData);
}
