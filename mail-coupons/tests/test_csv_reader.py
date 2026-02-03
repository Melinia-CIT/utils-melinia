#!/usr/bin/env python3
"""Tests for CSV reader module."""

import pytest
import tempfile
import os
from mail_coupons.csv_reader import read_recipients


class TestCSVReader:
    """Test cases for CSV reading functionality."""

    @pytest.fixture
    def valid_csv(self):
        """Create a valid CSV file for testing."""
        content = (
            "roll_no,college_mail,name,is_paid\n"
            "ROLL001,student1@college.edu,John Doe,true\n"
            "ROLL002,student2@college.edu,Jane Smith,false\n"
            "ROLL003,student3@college.edu,Bob Wilson,true\n"
        )
        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
            f.write(content)
            return f.name

    def test_read_recipients_returns_list_of_dicts(self, valid_csv):
        """Test CSV reader returns correct format."""
        recipients = read_recipients(valid_csv)

        assert isinstance(recipients, list)
        assert len(recipients) == 3

        # Check first recipient
        assert recipients[0]["roll_no"] == "ROLL001"
        assert recipients[0]["email"] == "student1@college.edu"
        assert recipients[0]["name"] == "John Doe"
        assert recipients[0]["is_paid"] is True

        # Check second recipient
        assert recipients[1]["roll_no"] == "ROLL002"
        assert recipients[1]["email"] == "student2@college.edu"
        assert recipients[1]["name"] == "Jane Smith"
        assert recipients[1]["is_paid"] is False

    def test_read_recipients_handles_missing_file(self):
        """Test CSV reader raises error for missing file."""
        with pytest.raises(FileNotFoundError):
            read_recipients("/nonexistent/path.csv")

    def test_read_recipients_handles_empty_file(self):
        """Test CSV reader handles empty file."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
            f.write("roll_no,college_mail,name,is_paid\n")
            temp_path = f.name

        try:
            recipients = read_recipients(temp_path)
            assert recipients == []
        finally:
            os.unlink(temp_path)

    def test_read_recipients_handles_case_variations(self):
        """Test CSV reader handles different boolean case variations."""
        content = (
            "roll_no,college_mail,name,is_paid\n"
            "ROLL001,student1@college.edu,John Doe,True\n"
            "ROLL002,student2@college.edu,Jane Smith,FALSE\n"
            "ROLL003,student3@college.edu,Bob Wilson,1\n"
            "ROLL004,student4@college.edu,Alice Brown,0\n"
        )

        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
            f.write(content)
            temp_path = f.name

        try:
            recipients = read_recipients(temp_path)

            assert recipients[0]["is_paid"] is True
            assert recipients[1]["is_paid"] is False
            assert recipients[2]["is_paid"] is True
            assert recipients[3]["is_paid"] is False
        finally:
            os.unlink(temp_path)

    def test_read_recipients_handles_whitespace(self):
        """Test CSV reader handles whitespace in data."""
        content = (
            "roll_no,college_mail,name,is_paid\n"
            "  ROLL001  ,  student1@college.edu  ,  John Doe  , true \n"
        )

        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
            f.write(content)
            temp_path = f.name

        try:
            recipients = read_recipients(temp_path)

            assert recipients[0]["roll_no"] == "ROLL001"
            assert recipients[0]["email"] == "student1@college.edu"
            assert recipients[0]["name"] == "John Doe"
        finally:
            os.unlink(temp_path)

    def test_read_recipients_skips_empty_lines(self):
        """Test CSV reader skips empty lines."""
        content = (
            "roll_no,college_mail,name,is_paid\n"
            "ROLL001,student1@college.edu,John Doe,true\n"
            "\n"
            "\n"
            "ROLL002,student2@college.edu,Jane Smith,false\n"
        )

        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
            f.write(content)
            temp_path = f.name

        try:
            recipients = read_recipients(temp_path)

            assert len(recipients) == 2
        finally:
            os.unlink(temp_path)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
