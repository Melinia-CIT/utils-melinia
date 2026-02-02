"""Email sender module for sending coupon emails."""

import random
import string
import smtplib
import requests
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, Tuple


def generate_coupon_code() -> str:
    """Generate a random coupon code with format MLNC + 6 alphanumeric chars.

    Returns:
        A unique coupon code string
    """
    # Generate 3 random letters and 3 random digits, then shuffle
    letters = "".join(random.choices(string.ascii_uppercase, k=3))
    digits = "".join(random.choices(string.digits, k=3))
    random_part = "".join(random.sample(letters + digits, 6))
    return f"MLNC{random_part}"


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
        """
        self.api_endpoint = api_endpoint
        self.bearer_token = bearer_token
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.smtp_username = smtp_username
        self.smtp_password = smtp_password
        self.from_email = from_email
        self.register_url = register_url

    def _capitalize_name(self, name: str) -> str:
        """Capitalize each word in a name.

        Args:
            name: The name to capitalize

        Returns:
            Capitalized name
        """
        return " ".join(word.capitalize() for word in name.split())

    def create_coupon(self, coupon_code: str) -> bool:
        """Create a coupon via the API.

        Args:
            coupon_code: The coupon code to create

        Returns:
            True if successful, False otherwise
        """
        try:
            response = requests.post(
                self.api_endpoint,
                headers={
                    "Authorization": f"Bearer {self.bearer_token}",
                    "Content-Type": "application/json",
                },
                json={"code": coupon_code},
                timeout=10,
            )

            return response.status_code in (200, 201)
        except Exception as e:
            print(f"API error: {e}")
            return False

    def send_email(self, to_email: str, name: str, coupon_code: str) -> bool:
        """Send coupon email to recipient.

        Args:
            to_email: Recipient email address
            name: Recipient name
            coupon_code: The coupon code to send

        Returns:
            True if successful, False otherwise
        """
        try:
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

            # HTML version (simplified for now)
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
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)

            return True
        except Exception as e:
            print(f"SMTP error: {e}")
            return False

    def process_recipient(self, recipient: Dict[str, Any]) -> Tuple[bool, str]:
        """Process a single recipient: create coupon and send email.

        Args:
            recipient: Dictionary with roll_no, email, name, is_paid

        Returns:
            Tuple of (success: bool, coupon_code: str)
        """
        coupon_code = generate_coupon_code()

        # Create coupon via API
        if not self.create_coupon(coupon_code):
            return False, coupon_code

        # Send email
        if not self.send_email(recipient["email"], recipient["name"], coupon_code):
            return False, coupon_code

        return True, coupon_code
