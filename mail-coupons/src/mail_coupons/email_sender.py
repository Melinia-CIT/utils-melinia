"""Email sender module for sending coupon emails."""

import random
import string
import smtplib
import requests
import asyncio
import time
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, Tuple, List, Callable, Optional
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from enum import Enum


class EmailStatus(Enum):
    """Email processing status."""

    PENDING = "pending"
    COUPON_CREATED = "coupon_created"
    SENDING = "sending"
    SENT = "sent"
    FAILED = "failed"


@dataclass
class EmailResult:
    """Result of email processing."""

    recipient: Dict[str, Any]
    coupon_code: str
    status: EmailStatus
    success: bool
    error_message: str = ""
    processing_time_ms: float = 0.0


def generate_coupon_code() -> str:
    """Generate a random coupon code with format MLNC + 6 alphanumeric chars.

    Returns:
        A unique coupon code string
    """
    letters = "".join(random.choices(string.ascii_uppercase, k=3))
    digits = "".join(random.choices(string.digits, k=3))
    random_part = "".join(random.sample(letters + digits, 6))
    return f"MLNC{random_part}"


class AsyncRateLimiter:
    """Rate limiter for controlling email send rate."""

    def __init__(self, max_requests_per_second: int = 12):
        self.max_requests_per_second = max_requests_per_second
        self.min_interval = 1.0 / max_requests_per_second
        self.last_request_time = 0
        self._lock = asyncio.Lock()

    async def acquire(self):
        """Acquire permission to make a request, waiting if necessary."""
        async with self._lock:
            current_time = time.time()
            time_since_last = current_time - self.last_request_time

            if time_since_last < self.min_interval:
                wait_time = self.min_interval - time_since_last
                await asyncio.sleep(wait_time)

            self.last_request_time = time.time()


class EmailSender:
    """Email sender for processing recipients and sending coupon emails."""

    def __init__(
        self,
        api_endpoint: str,
        bearer_token: str,
        smtp_host: str,
        smtp_port: int,
        smtp_username: str,
        smtp_password: str,
        from_email: str,
        register_url: str = "https://melinia.in/register",
        rate_limit: int = 12,
        logger: Optional[logging.Logger] = None,
    ):
        """Initialize EmailSender with configuration.

        Args:
            api_endpoint: API endpoint for creating coupons
            bearer_token: Bearer token for API authentication
            smtp_host: SMTP server hostname
            smtp_port: SMTP server port
            smtp_username: SMTP authentication username
            smtp_password: SMTP authentication password
            from_email: From email address for sent emails
            register_url: Registration URL to include in emails
            rate_limit: Maximum emails per second (default: 12)
            logger: Optional logger instance
        """
        self.api_endpoint = api_endpoint
        self.bearer_token = bearer_token
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.smtp_username = smtp_username
        self.smtp_password = smtp_password
        self.from_email = from_email
        self.register_url = register_url
        self.rate_limiter = AsyncRateLimiter(rate_limit)
        self.logger = logger or logging.getLogger(__name__)
        self._executor = ThreadPoolExecutor(max_workers=rate_limit)

    def _capitalize_name(self, name: str) -> str:
        """Capitalize each word in a name."""
        return " ".join(word.capitalize() for word in name.split())

    def create_coupon(self, coupon_code: str) -> Tuple[bool, str]:
        """Create a coupon via the API (blocking operation).

        Args:
            coupon_code: The coupon code to create

        Returns:
            Tuple of (success: bool, error_message: str)
        """
        try:
            self.logger.debug(f"Creating coupon: {coupon_code}")
            response = requests.post(
                self.api_endpoint,
                headers={
                    "Authorization": f"Bearer {self.bearer_token}",
                    "Content-Type": "application/json",
                },
                json={"code": coupon_code},
                timeout=10,
            )

            if response.status_code not in (200, 201):
                error_msg = (
                    f"API error: Status {response.status_code} - {response.text}"
                )
                self.logger.warning(error_msg)
                return False, error_msg

            self.logger.debug(f"Coupon created successfully: {coupon_code}")
            return True, ""
        except requests.exceptions.Timeout:
            error_msg = f"API timeout while creating coupon {coupon_code}"
            self.logger.error(error_msg)
            return False, error_msg
        except requests.exceptions.ConnectionError as e:
            error_msg = f"API connection error: {str(e)}"
            self.logger.error(error_msg)
            return False, error_msg
        except Exception as e:
            error_msg = f"API error creating coupon {coupon_code}: {str(e)}"
            self.logger.error(error_msg, exc_info=True)
            return False, error_msg

    def send_email(
        self, to_email: str, name: str, coupon_code: str
    ) -> Tuple[bool, str]:
        """Send coupon email to recipient (blocking operation).

        Args:
            to_email: Recipient email address
            name: Recipient name
            coupon_code: The coupon code to send

        Returns:
            Tuple of (success: bool, error_message: str)
        """
        try:
            self.logger.debug(
                f"Preparing email for {to_email} with coupon {coupon_code}"
            )
            capitalized_name = self._capitalize_name(name)

            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "Your Registration Coupon for Melinia'26"
            msg["From"] = f"Melinia'26 <{self.from_email}>"
            msg["To"] = to_email

            # Plain text version
            text_content = f"""Hello {capitalized_name},

Your Registration Coupon for Melinia'26

Apply the code below to register for Melinia'26.

Your Coupon Code: {coupon_code}

Register here: {self.register_url}

This is an automated message, please do not reply to this email.
Need assistance? Contact us at helpdesk@melinia.in

Melinia'26 Dev Team
"""

            # HTML version
            html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registration Coupon</title>
    <style>
        * {{ box-sizing: border-box; }}
        body {{
            margin: 0;
            padding: 0;
            background-color: #09090b;
            font-family: system-ui, -apple-system, sans-serif;
            color: #f4f4f5;
        }}
        @keyframes borderFlow {{
            0% {{ background-position: 0% 50%; }}
            50% {{ background-position: 100% 50%; }}
            100% {{ background-position: 0% 50%; }}
        }}
        .running-border {{
            background: linear-gradient(90deg, #A07CFE, #8FB5FE, #8FEBFE, #A07CFE);
            background-size: 300% 100%;
            animation: borderFlow 4s linear infinite;
        }}
        @media screen and (max-width: 480px) {{
            .container {{ padding: 20px 10px !important; }}
            .content {{ padding: 30px 20px !important; }}
            .coupon-box {{ 
                padding: 16px 10px !important; 
                font-size: 20px !important; 
            }}
        }}
    </style>
</head>
<body>
    <div class="container" style="max-width:600px;margin:0 auto;padding:48px 24px;">
        <div class="running-border" style="border-radius:20px;padding:4px;">
            <div style="background:#131317;border-radius:17px;overflow:hidden;">
                <img src="https://cdn.melinia.in/mln-e-bnr.jpg" alt="Melinia'26" style="display:block;width:100%;height:auto;border-radius:14px 14px 0 0;">
                
                <div class="content" style="padding:40px 36px;">
                    <div style="margin-bottom: 40px; text-align:center;">
                        <p style="margin:0; color:#ffffff; font-size:32px; font-weight:800; letter-spacing:-0.5px;">
                            Hello, <span>{capitalized_name}</span>
                        </p>
                    </div>

                    <div style="text-align:center;">
                        <h1 style="margin:0 0 14px; color:#71717a; font-size:18px; font-weight:500;">
                            Your Registration Coupon
                        </h1>
                        
                        <p style="margin:0 0 32px; color:#a1a1aa; font-size:16px;">
                            Apply the code below to register for Melinia'26.
                        </p>
                        
                        <div class="coupon-box" style="background:#1c1c22; border-radius:14px; padding:24px 28px; margin:0 auto 32px; max-width:380px; border:2px dashed #52525b;">
                            <div style="color:#fafafa; font-size:26px; font-weight:700; letter-spacing:4px; font-family:monospace;">
                                {coupon_code}
                            </div>
                        </div>
                        
                        <a href="{self.register_url}" style="display:inline-block; background:#fafafa; color:#131317; text-decoration:none; font-weight:600; font-size:16px; padding:16px 40px; border-radius:10px; margin-bottom:28px;">
                            Register Now
                        </a>
                    </div>
                </div>
                
                <div style="padding:24px 36px; border-top:1px solid #27272a; text-align:center; background:linear-gradient(180deg, transparent 0%, #18181b 100%);">
                    <p style="margin:0 0 10px; color:#52525b; font-size:12px;">
                        This is an automated message, please do not reply to this email.
                    </p>
                    <p style="margin:0 0 6px; color:#71717a; font-size:12px;">
                        Need assistance? <a href="mailto:helpdesk@melinia.in" style="color:#a1a1aa;">helpdesk@melinia.in</a>
                    </p>
                    <p style="margin:14px 0 0; color:#fafafa; font-size:13px; font-weight:600;">
                        Melinia'26 Dev Team
                    </p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
"""

            # Attach both parts
            part1 = MIMEText(text_content, "plain")
            part2 = MIMEText(html_content, "html")
            msg.attach(part1)
            msg.attach(part2)

            # Send email
            self.logger.debug(
                f"Connecting to SMTP server {self.smtp_host}:{self.smtp_port}"
            )
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)

            self.logger.debug(f"Email sent successfully to {to_email}")
            return True, ""

        except smtplib.SMTPAuthenticationError as e:
            error_msg = f"SMTP Authentication Error for {to_email}: {str(e)}"
            self.logger.error(error_msg)
            return False, error_msg
        except smtplib.SMTPRecipientsRefused as e:
            error_msg = f"SMTP Recipients Refused for {to_email}: {str(e)}"
            self.logger.error(error_msg)
            return False, error_msg
        except smtplib.SMTPSenderRefused as e:
            error_msg = f"SMTP Sender Refused for {to_email}: {str(e)}"
            self.logger.error(error_msg)
            return False, error_msg
        except smtplib.SMTPException as e:
            error_msg = f"SMTP Error sending to {to_email}: {str(e)}"
            self.logger.error(error_msg)
            return False, error_msg
        except Exception as e:
            error_msg = f"Unexpected error sending email to {to_email}: {str(e)}"
            self.logger.error(error_msg, exc_info=True)
            return False, error_msg

    def process_recipient_sync(self, recipient: Dict[str, Any]) -> EmailResult:
        """Process a single recipient synchronously (used by async wrapper).

        Args:
            recipient: Dictionary with roll_no, email, name, is_paid

        Returns:
            EmailResult with processing details
        """
        start_time = time.time()
        coupon_code = generate_coupon_code()

        self.logger.debug(
            f"Processing recipient: {recipient['name']} ({recipient['roll_no']})"
        )

        # Create coupon via API
        coupon_success, coupon_error = self.create_coupon(coupon_code)
        if not coupon_success:
            processing_time = (time.time() - start_time) * 1000
            return EmailResult(
                recipient=recipient,
                coupon_code=coupon_code,
                status=EmailStatus.FAILED,
                success=False,
                error_message=f"Coupon creation failed: {coupon_error}",
                processing_time_ms=processing_time,
            )

        # Send email
        email_success, email_error = self.send_email(
            recipient["email"], recipient["name"], coupon_code
        )

        processing_time = (time.time() - start_time) * 1000

        if email_success:
            return EmailResult(
                recipient=recipient,
                coupon_code=coupon_code,
                status=EmailStatus.SENT,
                success=True,
                processing_time_ms=processing_time,
            )
        else:
            return EmailResult(
                recipient=recipient,
                coupon_code=coupon_code,
                status=EmailStatus.FAILED,
                success=False,
                error_message=f"Email sending failed: {email_error}",
                processing_time_ms=processing_time,
            )

    async def process_recipient_async(self, recipient: Dict[str, Any]) -> EmailResult:
        """Process a single recipient asynchronously with rate limiting.

        Args:
            recipient: Dictionary with roll_no, email, name, is_paid

        Returns:
            EmailResult with processing details
        """
        # Wait for rate limiter
        await self.rate_limiter.acquire()

        # Run blocking operations in thread pool
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            self._executor, self.process_recipient_sync, recipient
        )

        return result

    async def process_recipients_batch(
        self,
        recipients: List[Dict[str, Any]],
        progress_callback: Optional[Callable[[int, int, EmailResult], None]] = None,
    ) -> List[EmailResult]:
        """Process multiple recipients in parallel with rate limiting.

        Args:
            recipients: List of recipient dictionaries
            progress_callback: Optional callback function(current, total, result)

        Returns:
            List of EmailResult objects
        """
        self.logger.info(
            f"Starting batch processing of {len(recipients)} recipients at {self.rate_limiter.max_requests_per_second} emails/second"
        )

        total = len(recipients)
        completed = 0
        results = []

        # Create tasks for all recipients
        tasks = [self.process_recipient_async(r) for r in recipients]

        # Process as they complete
        for coro in asyncio.as_completed(tasks):
            result = await coro
            completed += 1
            results.append(result)

            if progress_callback:
                progress_callback(completed, total, result)

            # Log individual results
            if result.success:
                self.logger.info(
                    f"✓ [{completed}/{total}] Sent to {result.recipient['name']} ({result.recipient['roll_no']}) - Coupon: {result.coupon_code} - {result.processing_time_ms:.0f}ms"
                )
            else:
                self.logger.error(
                    f"✗ [{completed}/{total}] Failed for {result.recipient['name']} ({result.recipient['roll_no']}) - Coupon: {result.coupon_code} - Error: {result.error_message}"
                )

        return results

    def close(self):
        """Clean up resources."""
        self._executor.shutdown(wait=True)
        self.logger.debug("EmailSender resources cleaned up")
