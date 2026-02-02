#!/usr/bin/env python3
"""Tests for email sender module."""

import pytest
from unittest.mock import patch, MagicMock
from mail_coupons.email_sender import EmailSender, generate_coupon_code


class TestCouponCodeGenerator:
    """Test cases for coupon code generation."""

    def test_generate_coupon_code_format(self):
        """Test coupon code has correct format: MLNC + 6 alphanumeric chars."""
        code = generate_coupon_code()
        assert code.startswith("MLNC")
        assert len(code) == 10  # MLNC + 6 characters
        assert code[4:].isalnum()

    def test_generate_coupon_code_unique(self):
        """Test that multiple calls generate different codes."""
        codes = [generate_coupon_code() for _ in range(10)]
        # All codes should be unique
        assert len(codes) == len(set(codes))


class TestEmailSender:
    """Test cases for email sending functionality."""

    @pytest.fixture
    def email_sender(self):
        """Create EmailSender instance for testing."""
        return EmailSender(
            api_endpoint="https://api.example.com/coupons",
            bearer_token="test_token_123",
            smtp_host="smtp.example.com",
            smtp_port=587,
            smtp_username="user@example.com",
            smtp_password="password123",
            from_email="noreply@example.com",
        )

    def test_email_sender_initialization(self, email_sender):
        """Test EmailSender initializes with correct attributes."""
        assert email_sender.api_endpoint == "https://api.example.com/coupons"
        assert email_sender.bearer_token == "test_token_123"
        assert email_sender.smtp_host == "smtp.example.com"
        assert email_sender.smtp_port == 587

    def test_create_coupon_success(self, email_sender):
        """Test successful coupon creation via API."""
        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_response.json.return_value = {"code": "MLNC123ABC"}

        with patch(
            "mail_coupons.email_sender.requests.post", return_value=mock_response
        ):
            result = email_sender.create_coupon("MLNC123ABC")
            assert result is True

    def test_create_coupon_api_failure(self, email_sender):
        """Test coupon creation handles API failure."""
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"

        with patch(
            "mail_coupons.email_sender.requests.post", return_value=mock_response
        ):
            result = email_sender.create_coupon("MLNC123ABC")
            assert result is False

    def test_send_email_success(self, email_sender):
        """Test successful email sending."""
        with patch("mail_coupons.email_sender.smtplib.SMTP") as mock_smtp:
            mock_server = MagicMock()
            mock_smtp.return_value.__enter__.return_value = mock_server

            result = email_sender.send_email(
                to_email="student@example.com",
                name="John Doe",
                coupon_code="MLNC123ABC",
            )

            assert result is True
            mock_server.starttls.assert_called_once()
            mock_server.login.assert_called_once_with("user@example.com", "password123")
            mock_server.send_message.assert_called_once()

    def test_send_email_smtp_failure(self, email_sender):
        """Test email sending handles SMTP failure."""
        with patch(
            "mail_coupons.email_sender.smtplib.SMTP",
            side_effect=Exception("SMTP connection failed"),
        ):
            result = email_sender.send_email(
                to_email="student@example.com",
                name="John Doe",
                coupon_code="MLNC123ABC",
            )
            assert result is False

    def test_process_recipient_full_flow_success(self, email_sender):
        """Test complete recipient processing flow."""
        recipient = {
            "roll_no": "ROLL123",
            "email": "student@example.com",
            "name": "John Doe",
            "is_paid": True,
        }

        # Mock both coupon creation and email sending
        with (
            patch.object(
                email_sender, "create_coupon", return_value=True
            ) as mock_create,
            patch.object(email_sender, "send_email", return_value=True) as mock_send,
        ):
            success, coupon_code = email_sender.process_recipient(recipient)

            assert success is True
            assert coupon_code.startswith("MLNC")
            mock_create.assert_called_once()
            mock_send.assert_called_once()

    def test_process_recipient_coupon_creation_fails(self, email_sender):
        """Test recipient processing when coupon creation fails."""
        recipient = {
            "roll_no": "ROLL123",
            "email": "student@example.com",
            "name": "John Doe",
            "is_paid": True,
        }

        with patch.object(email_sender, "create_coupon", return_value=False):
            success, coupon_code = email_sender.process_recipient(recipient)

            assert success is False
            assert coupon_code is not None  # Code is still generated

    def test_process_recipient_email_sending_fails(self, email_sender):
        """Test recipient processing when email sending fails."""
        recipient = {
            "roll_no": "ROLL123",
            "email": "student@example.com",
            "name": "John Doe",
            "is_paid": True,
        }

        with (
            patch.object(email_sender, "create_coupon", return_value=True),
            patch.object(email_sender, "send_email", return_value=False),
        ):
            success, coupon_code = email_sender.process_recipient(recipient)

            assert success is False

    def test_capitalize_name(self, email_sender):
        """Test name capitalization."""
        assert email_sender._capitalize_name("john doe") == "John Doe"
        assert email_sender._capitalize_name("JANE SMITH") == "Jane Smith"
        assert email_sender._capitalize_name("bob WILSON") == "Bob Wilson"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
