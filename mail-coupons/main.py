#!/usr/bin/env python3
"""Mail Coupons - Send registration coupons via email."""

import sys
import os

# Add src directory to path when running directly
if __name__ == "__main__":
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

import click
import logging
import asyncio
from datetime import datetime
from typing import Optional

from mail_coupons.csv_reader import read_recipients, read_recipients_from_directory
from mail_coupons.database import Database
from mail_coupons.login import authenticate_user
from mail_coupons.email_sender import EmailSender, EmailResult

# Configuration constants
API_ENDPOINT = "https://app.melinia.in/api/v1/coupons"
FROM_EMAIL = "onboard@melinia.dev"
SES_SMTP_HOST = "email-smtp.ap-south-1.amazonaws.com"
SES_SMTP_PORT = 587
REGISTER_URL = "https://melinia.in/register"
LOGIN_URL = "https://app.melinia.in/api/v1/auth/login"


class ColoredFormatter(logging.Formatter):
    """Custom formatter with colors for console output."""

    # ANSI color codes
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"

    # Colors
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"
    GRAY = "\033[90m"

    # Level colors
    LEVEL_COLORS = {
        "DEBUG": GRAY,
        "INFO": GREEN,
        "WARNING": YELLOW,
        "ERROR": RED,
        "CRITICAL": RED + BOLD,
    }

    def format(self, record: logging.LogRecord) -> str:
        # Get color for level
        level_color = self.LEVEL_COLORS.get(record.levelname, self.WHITE)

        # Format timestamp
        timestamp = datetime.fromtimestamp(record.created).strftime("%H:%M:%S.%f")[:-3]

        # Build the formatted message
        level_str = f"{level_color}{record.levelname:8}{self.RESET}"

        # Add emoji indicators for certain log levels
        emoji = ""
        if record.levelname == "INFO":
            emoji = "ℹ️  "
        elif record.levelname == "WARNING":
            emoji = "⚠️  "
        elif record.levelname == "ERROR":
            emoji = "❌ "
        elif record.levelname == "DEBUG":
            emoji = "🔍 "

        # Format the message
        msg = f"{self.GRAY}[{timestamp}]{self.RESET} {level_str} {emoji}{record.getMessage()}"

        # Add exception info if present
        if record.exc_info:
            exc_text = self.formatException(record.exc_info)
            msg += f"\n{self.RED}{exc_text}{self.RESET}"

        return msg


def setup_logging(verbose: bool = False, quiet: bool = False) -> logging.Logger:
    """Setup logging with custom formatting.

    Args:
        verbose: Enable debug logging
        quiet: Only show errors

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger("mail_coupons")
    logger.setLevel(
        logging.DEBUG if verbose else (logging.ERROR if quiet else logging.INFO)
    )

    # Remove existing handlers
    logger.handlers = []

    # Console handler with colors
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(
        logging.DEBUG if verbose else (logging.ERROR if quiet else logging.INFO)
    )
    console_handler.setFormatter(ColoredFormatter())
    logger.addHandler(console_handler)

    return logger


def print_banner():
    """Print application banner."""
    banner = f"""
{click.style("╔══════════════════════════════════════════════════════════════╗", fg="cyan", bold=True)}
{click.style("║", fg="cyan", bold=True)}  {click.style("🎫  Melinia'26 Coupon Email Sender", fg="white", bold=True)}{" " * 31}{click.style("║", fg="cyan", bold=True)}
{click.style("║", fg="cyan", bold=True)}  {click.style("Parallel email delivery with rate limiting", fg="bright_black")}{" " * 21}{click.style("║", fg="cyan", bold=True)}
{click.style("╚══════════════════════════════════════════════════════════════╝", fg="cyan", bold=True)}
"""
    click.echo(banner)


def print_progress_bar(
    current: int, total: int, success_count: int, fail_count: int, width: int = 50
):
    """Print a progress bar with statistics.

    Args:
        current: Current progress
        total: Total items
        success_count: Number of successful sends
        fail_count: Number of failed sends
        width: Width of the progress bar
    """
    percentage = (current / total) * 100
    filled = int(width * current / total)
    bar = click.style("█" * filled, fg="green") + click.style(
        "░" * (width - filled), fg="bright_black"
    )

    # Calculate rate
    elapsed = (datetime.now() - start_time).total_seconds()
    rate = current / elapsed if elapsed > 0 else 0

    status_line = f"\r{bar} {percentage:5.1f}% | {click.style(str(current), fg='cyan')}/{click.style(str(total), fg='white')} | "
    status_line += f"✓{click.style(str(success_count), fg='green')} ✗{click.style(str(fail_count), fg='red')} | "
    status_line += f"{rate:.1f} emails/s"

    click.echo(status_line, nl=False)


def on_progress_update(
    current: int, total: int, result: EmailResult, success_count: list, fail_count: list
):
    """Callback for progress updates.

    Args:
        current: Current count
        total: Total count
        result: EmailResult from processing
        success_count: List with single int for mutable reference
        fail_count: List with single int for mutable reference
    """
    if result.success:
        success_count[0] += 1
    else:
        fail_count[0] += 1
        # Print error details on new line
        click.echo(
            f"\n  {click.style('✗ Failed:', fg='red', bold=True)} {result.recipient['name']} ({result.recipient['roll_no']})"
        )
        click.echo(f"     {click.style('Coupon:', fg='yellow')} {result.coupon_code}")
        click.echo(f"     {click.style('Error:', fg='red')} {result.error_message}")
        click.echo(
            f"     {click.style('Time:', fg='blue')} {result.processing_time_ms:.0f}ms"
        )

    print_progress_bar(current, total, success_count[0], fail_count[0])


# Global start time for rate calculation
start_time: datetime = datetime.now()


@click.command()
@click.argument("csv_path", type=click.Path(exists=True))
@click.option("--username", required=True, help="Username for login authentication")
@click.option("--password", required=True, help="Password for login authentication")
@click.option("--smtp-username", required=True, help="SMTP username for email sending")
@click.option("--smtp-password", required=True, help="SMTP password for email sending")
@click.option(
    "--db-path",
    default="mail_coupons.db",
    help="Path to SQLite database for tracking sent emails",
)
@click.option(
    "--api-endpoint", default=API_ENDPOINT, help="API endpoint for creating coupons"
)
@click.option("--login-url", default=LOGIN_URL, help="Login API endpoint URL")
@click.option("--from-email", default=FROM_EMAIL, help="From email address")
@click.option("--smtp-host", default=SES_SMTP_HOST, help="SMTP server hostname")
@click.option("--smtp-port", default=SES_SMTP_PORT, help="SMTP server port")
@click.option("--register-url", default=REGISTER_URL, help="Registration URL")
@click.option("--rate-limit", default=12, help="Emails per second rate limit", type=int)
@click.option("-v", "--verbose", is_flag=True, help="Enable verbose debug logging")
@click.option("-q", "--quiet", is_flag=True, help="Only show errors")
@click.option("--no-progress", is_flag=True, help="Disable progress bar")
def main(
    csv_path,
    username,
    password,
    smtp_username,
    smtp_password,
    db_path,
    api_endpoint,
    login_url,
    from_email,
    smtp_host,
    smtp_port,
    register_url,
    rate_limit,
    verbose,
    quiet,
    no_progress,
):
    """Send registration coupons to recipients from CSV file or directory.

    CSV_PATH can be either:
    - A single CSV file
    - A directory containing multiple CSV files

    CSV Format: roll_no,email,name,is_paid

    Features:
    - Parallel processing with configurable rate limiting
    - Verbose logging with formatted output
    - Progress tracking with detailed error reporting
    - SQLite database for tracking sent emails
    - Directory processing with automatic deduplication by roll_no
    """
    global start_time

    # Setup logging
    logger = setup_logging(verbose=verbose, quiet=quiet)

    # Print banner
    print_banner()

    # Authenticate user
    logger.info(f"Authenticating at {login_url}...")
    try:
        bearer_token = authenticate_user(username, password, login_url)
        logger.info("Authentication successful ✓")
    except Exception as e:
        logger.error(f"Authentication failed: {e}")
        click.echo(f"\n{click.style('Troubleshooting:', fg='yellow', bold=True)}")
        click.echo(
            f"  {click.style('•', fg='cyan')} Verify the login URL is correct: {login_url}"
        )
        click.echo(f"  {click.style('•', fg='cyan')} Ensure the API server is running")
        click.echo(f"  {click.style('•', fg='cyan')} Check your username and password")
        click.echo(
            f"\nUse {click.style('--login-url', fg='yellow')} to specify a different endpoint"
        )
        sys.exit(1)

    # Initialize database
    logger.info(f"Initializing database: {db_path}")
    db = Database(db_path)
    logger.info("Database initialized ✓")

    # Read recipients from CSV file or directory
    is_directory = os.path.isdir(csv_path)

    if is_directory:
        logger.info(f"Reading recipients from directory: {csv_path}")
        try:
            all_recipients = read_recipients_from_directory(csv_path)
            csv_files = [f for f in os.listdir(csv_path) if f.endswith(".csv")]
            logger.info(f"Found {len(csv_files)} CSV files in directory")
            logger.info(f"Found {len(all_recipients)} unique recipients ✓")
        except Exception as e:
            logger.error(f"Error reading CSV directory: {e}")
            sys.exit(1)
    else:
        logger.info(f"Reading recipients from: {csv_path}")
        try:
            all_recipients = read_recipients(csv_path)
            logger.info(f"Found {len(all_recipients)} recipients in CSV ✓")
        except Exception as e:
            logger.error(f"Error reading CSV: {e}")
            sys.exit(1)

    # Filter out already sent emails
    unsent_recipients = db.get_unsent_recipients(all_recipients)
    already_sent = len(all_recipients) - len(unsent_recipients)

    if already_sent > 0:
        logger.info(f"Skipping {already_sent} recipients (already sent)")

    if len(unsent_recipients) == 0:
        logger.info("No new recipients to process. All emails already sent!")
        sys.exit(0)

    logger.info(
        f"Processing {len(unsent_recipients)} new recipients at {rate_limit} emails/second..."
    )

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
        rate_limit=rate_limit,
        logger=logger,
    )

    # Process recipients asynchronously
    start_time = datetime.now()
    success_count = [0]  # Using list for mutable reference in closure
    fail_count = [0]

    async def run_processing():
        """Run the async email processing."""
        if no_progress or verbose:
            # No progress bar, just log results
            results = await email_sender.process_recipients_batch(unsent_recipients)
            for result in results:
                if result.success:
                    success_count[0] += 1
                    db.mark_email_sent(
                        result.recipient["roll_no"],
                        result.recipient["email"],
                        result.recipient["name"],
                        result.recipient["is_paid"],
                    )
                else:
                    fail_count[0] += 1
            return results
        else:
            # With progress bar
            def progress_callback(current: int, total: int, result: EmailResult):
                on_progress_update(current, total, result, success_count, fail_count)
                if result.success:
                    db.mark_email_sent(
                        result.recipient["roll_no"],
                        result.recipient["email"],
                        result.recipient["name"],
                        result.recipient["is_paid"],
                    )

            return await email_sender.process_recipients_batch(
                unsent_recipients, progress_callback=progress_callback
            )

    try:
        # Run the async processing
        results = asyncio.run(run_processing())

        # Clear progress bar line
        if not no_progress and not verbose:
            click.echo()

    except KeyboardInterrupt:
        logger.warning("Interrupted by user")
        email_sender.close()
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error during processing: {e}", exc_info=verbose)
        email_sender.close()
        sys.exit(1)
    finally:
        email_sender.close()

    # Calculate statistics
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    avg_time = (
        sum(r.processing_time_ms for r in results) / len(results) if results else 0
    )

    # Print summary
    click.echo()
    click.echo(click.style("═" * 60, fg="cyan", bold=True))
    click.echo(click.style("📊  PROCESSING SUMMARY", fg="white", bold=True))
    click.echo(click.style("═" * 60, fg="cyan", bold=True))

    click.echo(f"  {click.style('Total Recipients:', fg='white')}: {len(results)}")
    click.echo(f"  {click.style('Successful:', fg='green')}: {success_count[0]} ✓")
    click.echo(f"  {click.style('Failed:', fg='red')}: {fail_count[0]} ✗")
    click.echo(
        f"  {click.style('Success Rate:', fg='cyan')}: {(success_count[0] / len(results) * 100):.1f}%"
    )
    click.echo()
    click.echo(f"  {click.style('Duration:', fg='white')}: {duration:.1f} seconds")
    click.echo(
        f"  {click.style('Average Time:', fg='white')}: {avg_time:.0f}ms per email"
    )
    click.echo(
        f"  {click.style('Effective Rate:', fg='white')}: {len(results) / duration:.1f} emails/second"
    )
    click.echo(click.style("═" * 60, fg="cyan", bold=True))

    if fail_count[0] > 0:
        click.echo()
        click.echo(click.style("⚠️  Failed Recipients:", fg="red", bold=True))
        for result in results:
            if not result.success:
                click.echo(
                    f"   • {result.recipient['name']} ({result.recipient['roll_no']}) - {result.coupon_code}"
                )
        click.echo()
        sys.exit(1)
    else:
        click.echo()
        click.echo(
            click.style("✨ All emails sent successfully! ✨", fg="green", bold=True)
        )
        click.echo()


if __name__ == "__main__":
    main()
