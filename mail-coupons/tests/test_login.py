#!/usr/bin/env python3
"""Tests for login functionality."""

import pytest
from unittest.mock import patch, MagicMock
from mail_coupons.login import authenticate_user


class TestLoginFunctionality:
    """Test cases for user authentication."""

    def test_authenticate_user_success(self):
        """Test successful login returns token."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"token": "test_bearer_token_123"}

        with patch("mail_coupons.login.requests.post", return_value=mock_response):
            result = authenticate_user("testuser", "testpass")
            assert result == "test_bearer_token_123"

    def test_authenticate_user_failure_invalid_credentials(self):
        """Test login failure raises exception."""
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.text = "Unauthorized"

        with patch("mail_coupons.login.requests.post", return_value=mock_response):
            with pytest.raises(Exception) as exc_info:
                authenticate_user("wronguser", "wrongpass")
            assert "Login failed" in str(exc_info.value)

    def test_authenticate_user_server_error(self):
        """Test server error raises exception."""
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"

        with patch("mail_coupons.login.requests.post", return_value=mock_response):
            with pytest.raises(Exception) as exc_info:
                authenticate_user("user", "pass")
            assert "Login failed" in str(exc_info.value)

    def test_authenticate_user_request_exception(self):
        """Test network error raises exception."""
        with patch(
            "mail_coupons.login.requests.post",
            side_effect=Exception("Connection error"),
        ):
            with pytest.raises(Exception) as exc_info:
                authenticate_user("user", "pass")
            assert "Connection error" in str(exc_info.value)
