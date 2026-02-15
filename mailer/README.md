# Mailer

A high-performance CLI bulk email sender built with Bun for the Melinia'26 Tech Team.

## Description

Mailer is a command-line tool designed for sending bulk personalized emails efficiently. It reads recipient data from CSV files, renders email content using Pug templates, and sends emails via SMTP with built-in rate limiting and parallel processing.

### Features

- **Bulk Email Sending** - Send personalized emails to thousands of recipients from a CSV file
- **Pug Templates** - Rich email templates with YAML frontmatter for subject lines
- **SMTP Support** - Works with any SMTP server (Gmail, SendGrid, Mailgun, etc.)
- **Rate Limiting** - Configurable emails per second to avoid being flagged as spam
- **Parallel Processing** - Concurrent email sending with progress tracking
- **Progress Display** - Real-time progress bar with speed and ETA
- **Error Handling** - Detailed failure reports for debugging

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Create SMTP Configuration

Create a `smtp.yaml` file in your project root:

```yaml
host: smtp.gmail.com
port: 465
secure: true
auth:
  user: your-email@gmail.com
  pass: your-app-password
from: Your Name <your-email@gmail.com>
rate_limit:
  emails_per_second: 10
```

### 3. Prepare Your CSV Data

Create a CSV file (e.g., `recipients.csv`):

```csv
email,name,coupon,company,plan
john@example.com,John Doe,SAVE20,Acme Corp,Premium
jane@example.com,Jane Smith,WELCOME15,Tech Inc,Basic
```

### 4. Create an Email Template

Create a Pug template in `templates/` (e.g., `templates/promo.pug`):

```pug
---
subject: Special Offer for #{name}!
---
h1 Hello #{name}

p Your coupon code: #{coupon}

p Company: #{company}

p Plan: #{plan}
```

### 5. Send Emails

```bash
bun start -- --template promo --data recipients.csv
```

## Usage

### Command Syntax

```bash
bun start -- --template <template_name> --data <csv_file>
```

### Arguments

| Argument    | Required | Description                    |
|-------------|----------|--------------------------------|
| `--template`| Yes      | Name of the Pug template (without extension) |
| `--data`    | Yes      | Path to CSV file with recipients |

### Example Commands

```bash
# Send emails using a template
bun start -- --template hackathon --data attendees.csv

# Send outreach emails
bun start -- --template outreach --data contacts.csv
```

## Configuration

### SMTP Configuration (`smtp.yaml`)

| Field           | Type    | Description                                      |
|-----------------|---------|--------------------------------------------------|
| `host`          | string  | SMTP server hostname                             |
| `port`          | number  | SMTP server port (typically 465 or 587)         |
| `secure`        | boolean | Use TLS/SSL (true for 465, false for 587)      |
| `auth.user`     | string  | SMTP username                                    |
| `auth.pass`     | string  | SMTP password or app-specific password           |
| `from`          | string  | Sender email address and name                    |
| `rate_limit.emails_per_second` | number | Maximum emails to send per second (default: 12) |

### Gmail App Password Setup

If using Gmail:
1. Enable 2-Factor Authentication
2. Go to Google Account > Security > App Passwords
3. Generate a new app password
4. Use that password in `smtp.yaml`

## CSV Format

The CSV file must contain at least an `email` column. Additional columns become template variables.

### Required Columns

- `email` - Recipient email address

### Optional Columns

Any additional columns can be used as variables in your Pug templates.

```csv
email,name,event_name,date,venue
alice@example.com,Alice,Tech Summit,March 15,Convention Center
bob@example.com,Bob,Hackathon 2026,April 1,Tech Hub
```

## Templates

### Pug Template Format

Templates use [Pug](https://pugjs.org/) syntax with YAML frontmatter for metadata:

```pug
---
subject: Your Email Subject Here
---
html
  body
    h1 Hello #{name}
    p Welcome to #{event_name}!
    p Date: #{date}
    p Venue: #{venue}
```

### Template Variables

Use `#{variable_name}` to insert data from your CSV:

- `#{name}` - Recipient's name
- `#{email}` - Recipient's email
- Any other column from your CSV

### Included Templates

The project includes sample templates in `templates/`:

- `email.pug` - Basic promotional email
- `hackathon.pug` - Hackathon announcement
- `outreach.pug` - General outreach
- `pitchpit.pug` - Pitch competition invitation

## Output

The CLI displays real-time progress:

```
Sending: |██████████████████████          | 50% | 50/100 | john@example.com | Speed: 10.2 emails/s | ETA: 5s
```

And a summary after completion:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ 98 emails sent successfully
✗ 2 emails failed

Failed emails:
  1. John Doe (invalid-email)
     Error: Invalid email format
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Error Codes

- Exit code `0` - All emails sent successfully
- Exit code `1` - One or more emails failed

## Troubleshooting

### "Failed to connect to SMTP server"
- Check your `host` and `port` in `smtp.yaml`
- Verify your SMTP credentials
- For Gmail, ensure you're using an App Password

### "Missing required field 'email'"
- Ensure your CSV has an `email` column header
- Check for empty rows in your CSV

### Rate limiting issues
- Reduce `emails_per_second` in `smtp.yaml`
- Most SMTP servers allow 10-20 emails/second

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **SMTP**: [Nodemailer](https://nodemailer.com/)
- **Templating**: [Pug](https://pugjs.org/)
- **CSV Parsing**: [csv-parse](https://csv.js.org/)
- **CLI UI**: [tasuku](https://github.com/privatenumber/tasuku)

## Authors

**[Melinia'26 Tech Team](https://github.com/orgs/Melinia-CIT/teams/2026-dev-team)**

---

For issues or questions, please contact the [Melinia'26 Tech Team](https://github.com/orgs/Melinia-CIT/teams/2026-dev-team).
