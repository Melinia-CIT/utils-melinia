#!/usr/bin/env python3
"""Mail Coupons - Send registration coupons via email."""

import sys
import click
import getpass
from mail_coupons.csv_reader import read_recipients
from mail_coupons.database import Database
from mail_coupons.login import authenticate_user
from mail_coupons.email_sender import EmailSender

# Configuration constants
API_ENDPOINT = "https://app.melinia.in/api/v1/coupons"
FROM_EMAIL = "onboard@melinia.dev"
SES_SMTP_HOST = "email-smtp.ap-south-1.amazonaws.com"
SES_SMTP_PORT = 587
REGISTER_URL = "https://melinia.in/register"
LOGIN_URL = "http://localhost:3000/v1/api/login"


@click.command()
@click.argument("csv_file", type=click.Path(exists=True))
@click.option("--username", help="Username for login authentication")
@click.option("--password", help="Password for login authentication")
@click.option("--smtp-username", required=True, help="SMTP username for email sending")
@click.option("--smtp-password", help="SMTP password for email sending")
@click.option(
    "--db-path",
    default="mail_coupons.db",
    help="Path to SQLite database for tracking sent emails",
)
@click.option(
    "--api-endpoint", default=API_ENDPOINT, help="API endpoint for creating coupons"
)
@click.option("--from-email", default=FROM_EMAIL, help="From email address")
@click.option("--smtp-host", default=SES_SMTP_HOST, help="SMTP server hostname")
@click.option("--smtp-port", default=SES_SMTP_PORT, help="SMTP server port")
@click.option("--register-url", default=REGISTER_URL, help="Registration URL")
def main(
    csv_file,
    username,
    password,
    smtp_username,
    smtp_password,
    db_path,
    api_endpoint,
    from_email,
    smtp_host,
    smtp_port,
    register_url,
):
    """Send registration coupons to recipients from CSV file.

    CSV Format: roll_no,clg mail,name,is_paid
    """
    click.echo("🎫 Melinia'26 Coupon Sender")
    click.echo("=" * 50)

    # Prompt for credentials if not provided
    if not username:
        username = click.prompt("Enter username", type=str)

    if not password:
        password = getpass.getpass("Enter password: ")

    if not smtp_password:
        smtp_password = getpass.getpass("Enter SMTP password: ")

    # Authenticate user
    click.echo("\n🔐 Authenticating...")
    try:
        bearer_token = authenticate_user(username, password)
        click.echo("✓ Authentication successful")
    except Exception as e:
        click.echo(f"✗ Authentication failed: {e}", err=True)
        sys.exit(1)

    # Initialize database
    click.echo(f"\n📊 Initializing database: {db_path}")
    db = Database(db_path)

    # Read recipients from CSV
    click.echo(f"\n📋 Reading recipients from: {csv_file}")
    try:
        all_recipients = read_recipients(csv_file)
        click.echo(f"✓ Found {len(all_recipients)} recipients in CSV")
    except Exception as e:
        click.echo(f"✗ Error reading CSV: {e}", err=True)
        sys.exit(1)

    # Filter out already sent emails
    unsent_recipients = db.get_unsent_recipients(all_recipients)
    already_sent = len(all_recipients) - len(unsent_recipients)

    if already_sent > 0:
        click.echo(f"ℹ️  Skipping {already_sent} recipients (already sent)")

    if len(unsent_recipients) == 0:
        click.echo("\n✓ No new recipients to process. All emails already sent!")
        sys.exit(0)

    click.echo(f"\n📧 Processing {len(unsent_recipients)} new recipients...")

    # Initialize email sender
    email_sender = EmailSender(
        api_endpoint=api_endpoint,
        bearer_token=bearer_token,
        smtp_host=smtp_host,
        smtp_port=smtp_port,
        smtp_username=smtp_username,
        smtp_password=smtp_password,
        from_email=from_email,
        register_url=register_url,
    )

    # Process recipients
    success_count = 0
    fail_count = 0

    with click.progressbar(
        unsent_recipients, label="Sending emails", show_eta=True
    ) as recipients:
        for recipient in recipients:
            success, coupon_code = email_sender.process_recipient(recipient)

            if success:
                # Mark as sent in database
                db.mark_email_sent(
                    recipient["roll_no"],
                    recipient["email"],
                    recipient["name"],
                    recipient["is_paid"],
                )
                success_count += 1
            else:
                fail_count += 1
                click.echo(
                    f"\n✗ Failed: {recipient['name']} ({recipient['roll_no']}) - {coupon_code}",
                    err=True,
                )

    # Print summary
    click.echo("\n" + "=" * 50)
    click.echo(f"✓ Success: {success_count}")
    click.echo(f"✗ Failed:  {fail_count}")
    click.echo(f"📊 Total:   {success_count + fail_count}")
    click.echo("=" * 50)

    if fail_count > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
