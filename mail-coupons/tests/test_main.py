#!/usr/bin/env python3
"""Tests for main CLI application."""

import pytest
from unittest.mock import patch, MagicMock
import tempfile
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


class TestMainCLI:
    """Test cases for main CLI integration."""

    @pytest.fixture
    def sample_csv(self):
        """Create a sample CSV file."""
        content = (
            "roll_no,clg mail,name,is_paid\n"
            "ROLL001,student1@college.edu,John Doe,true\n"
            "ROLL002,student2@college.edu,Jane Smith,false\n"
        )
        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
            f.write(content)
            yield f.name
            # Cleanup
            os.unlink(f.name)

    def test_cli_requires_csv_file(self):
        """Test CLI requires CSV file argument."""
        from click.testing import CliRunner
        import main as main_module

        runner = CliRunner()
        result = runner.invoke(main_module.main, [])

        assert result.exit_code != 0

    def test_cli_accepts_all_required_arguments(self, sample_csv):
        """Test CLI accepts all required arguments."""
        from click.testing import CliRunner
        import main as main_module

        runner = CliRunner()

        # Mock all the dependencies
        with (
            patch.object(main_module, "authenticate_user") as mock_auth,
            patch.object(main_module, "Database") as mock_db_class,
            patch.object(main_module, "EmailSender") as mock_sender_class,
            patch.object(main_module, "read_recipients") as mock_read,
        ):
            mock_auth.return_value = "test_token"

            # Mock database instance
            mock_db_instance = MagicMock()
            mock_db_instance.get_unsent_recipients.return_value = []
            mock_db_class.return_value = mock_db_instance

            # Mock email sender instance
            mock_sender_instance = MagicMock()
            mock_sender_class.return_value = mock_sender_instance

            mock_read.return_value = []

            result = runner.invoke(
                main_module.main,
                [
                    sample_csv,
                    "--username",
                    "testuser",
                    "--password",
                    "testpass",
                    "--smtp-username",
                    "smtp@example.com",
                    "--smtp-password",
                    "smtppass",
                ],
            )

            # Should not crash and should authenticate
            assert mock_auth.called
            assert result.exit_code == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
