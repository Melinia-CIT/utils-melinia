import task from 'tasuku';
import { parseArgs } from './parse.ts';
import { loadConfig } from '../config/load.ts';
import { validateConfig } from '../config/validate.ts';
import { parseCSV } from '../csv/parse.ts';
import { loadTemplate } from '../templates/loader.ts';
import { renderTemplate } from '../templates/render.ts';
import { createTransport } from '../mailer/transport.ts';
import { sendEmail } from '../mailer/send.ts';

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function createTokenBucket(tokensPerSecond: number, maxTokens: number) {
  let tokens = maxTokens;
  let lastRefill = Date.now();

  return async function acquireToken(): Promise<void> {
    const now = Date.now();
    const elapsed = (now - lastRefill) / 1000;
    tokens = Math.min(maxTokens, tokens + elapsed * tokensPerSecond);
    lastRefill = now;

    if (tokens >= 1) {
      tokens -= 1;
      return;
    }

    const waitTime = (1 - tokens) * (1000 / tokensPerSecond);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    await acquireToken();
  };
}

function updateProgress(current: number, total: number, recipient: string, speed: number, eta: number) {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round(percentage / 2);
  const empty = 50 - filled;
  const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
  process.stdout.write(`\rSending: |${bar}| ${percentage}% | ${current}/${total} | ${recipient} | Speed: ${speed.toFixed(1)} emails/s | ETA: ${eta}s`);
}

async function sendParallel(
  recipients: any[],
  concurrency: number,
  tokenBucket: () => Promise<void>,
  transport: any,
  loadedTemplate: any,
  config: any,
  onUpdate: (totalSent: number, recipient: string) => void
): Promise<{ successCount: number; failureCount: number; failedEmails: any[] }> {
  const pool = new Set<Promise<void>>();
  const results: Promise<void>[] = [];
  let successCount = 0;
  let failureCount = 0;
  const failedEmails: any[] = [];
  const startTime = Date.now();
  let lastUpdate = 0;

  const sendFn = async (recipient: any) => {
    const recipientName = recipient.name || recipient.email;
    const recipientEmail = recipient.email as string;

    if (!recipientEmail || !isValidEmail(recipientEmail)) {
      const errorMsg = !recipientEmail ? 'Missing email' : 'Invalid email format';
      failedEmails.push({ email: recipientEmail || 'N/A', name: recipientName, error: errorMsg });
      failureCount++;
      return;
    }

    try {
      await tokenBucket();

      const html = renderTemplate(loadedTemplate.template, recipient);
      const email = {
        from: config.from,
        to: recipientEmail,
        subject: loadedTemplate.subject,
        html
      };
      await sendEmail(transport, email);
      successCount++;

      const now = Date.now();
      if (now - lastUpdate > 100) {
        const totalSent = successCount + failureCount;
        const elapsed = (now - startTime) / 1000;
        const speed = elapsed > 0 ? totalSent / elapsed : 0;
        const eta = speed > 0 ? Math.round((recipients.length - totalSent) / speed) : 0;
        onUpdate(totalSent, `${recipientName} (${recipientEmail})`);
        lastUpdate = now;
      }
    } catch (error) {
      const errorMsg = (error as Error).message;
      failedEmails.push({ email: recipientEmail, name: recipientName, error: errorMsg });
      failureCount++;
    }
  };

  for (const recipient of recipients) {
    const promise = sendFn(recipient).then(() => {
      pool.delete(promise);
    });
    results.push(promise);
    pool.add(promise);

    if (pool.size >= concurrency) {
      await Promise.race(pool);
    }
  }

  await Promise.all(results);

  return { successCount, failureCount, failedEmails };
}

async function main() {
  const args = parseArgs();

  const configResult = await task('Loading configuration', async ({ setTitle }) => {
    setTitle('Reading smtp.yaml...');
    const rawConfig = await loadConfig();
    const validatedConfig = validateConfig(rawConfig);
    setTitle('Configuration loaded');
    return validatedConfig;
  });

  const config = configResult.result;

  const emailsPerSecond = config.rate_limit?.emails_per_second || 12;
  const tokenBucket = createTokenBucket(emailsPerSecond, emailsPerSecond);

  await task('Verifying SMTP connection', async ({ setTitle }) => {
    setTitle('Connecting to SMTP server...');
    const transport = createTransport(config);
    try {
      await transport.verify();
      setTitle('SMTP connection verified');
    } catch (error) {
      console.error('SMTP verification error:', error);
      throw error;
    }
  });

  const results = await task.group(task => [
    task('Loading template', async ({ setTitle }) => {
      setTitle(`Loading template: ${args.template}...`);
      const loadedTemplate = await loadTemplate(args.template);
      setTitle('Template loaded');
      return loadedTemplate;
    }),

    task('Loading recipients', async ({ setTitle }) => {
      setTitle(`Loading CSV: ${args.data}...`);
      const recipients = await parseCSV(args.data);
      setTitle(`${recipients.length} recipients loaded`);
      return recipients;
    })
  ], { concurrency: 1 });

  const loadedTemplate = results[0].result;
  const recipients = results[1].result;

  const transport = createTransport(config);

  console.log('\n');
  console.log(`Sending ${recipients.length} emails with ${emailsPerSecond} concurrent workers...`);

  const startTime = Date.now();
  let lastProgressUpdate = 0;

  const { successCount, failureCount, failedEmails } = await sendParallel(
    recipients,
    emailsPerSecond,
    tokenBucket,
    transport,
    loadedTemplate,
    config,
    (totalSent, recipient) => {
      const now = Date.now();
      if (now - lastProgressUpdate > 100) {
        const elapsed = (now - startTime) / 1000;
        const speed = elapsed > 0 ? totalSent / elapsed : 0;
        const eta = speed > 0 ? Math.round((recipients.length - totalSent) / speed) : 0;
        updateProgress(totalSent, recipients.length, recipient, speed, eta);
        lastProgressUpdate = now;
      }
    }
  );

  process.stdout.write('\n');

  await new Promise(resolve => setTimeout(resolve, 300));

  let output = '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  output += `\n✓ ${successCount} emails sent successfully`;
  output += `\n✗ ${failureCount} emails failed`;

  if (failureCount > 0) {
    output += '\n\nFailed emails:';
    failedEmails.forEach((failed, index) => {
      output += `\n  ${index + 1}. ${failed.name} (${failed.email})`;
      output += `\n     Error: ${failed.error}`;
    });
  }

  output += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  console.error(output);

  await new Promise(resolve => setTimeout(resolve, 500));

  process.exit(failureCount > 0 ? 1 : 0);
}

main().catch(error => {
  if (error.message.includes('ENOTFOUND')) {
    console.error('\n✗ Error: Failed to connect to SMTP server. Please check your smtp.yaml configuration.');
  } else {
    console.error('\n✗ Error:', error.message);
  }
  process.exit(1);
});
