"""Comprehensive tests for data processing edge cases."""

import pytest
import tempfile
import os
from mail_coupons.csv_reader import read_recipients


class TestDataProcessingEdgeCases:
    """Test edge cases in CSV data processing."""

    def test_email_case_sensitivity(self):
        """Test that email case is preserved but should we normalize?"""
        content = (
            "roll_no,college_mail,name,is_paid\n"
            "ROLL001,Student1@College.EDU,John Doe,true\n"
            "ROLL002,STUDENT2@COLLEGE.EDU,Jane Smith,true\n"
            "ROLL003,student3@college.edu,Bob Wilson,true\n"
        )

        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
            f.write(content)
            temp_path = f.name

        try:
            recipients = read_recipients(temp_path)
            # Currently preserves case - should we normalize to lowercase?
            assert recipients[0]["email"] == "Student1@College.EDU"
            assert recipients[1]["email"] == "STUDENT2@COLLEGE.EDU"
            assert recipients[2]["email"] == "student3@college.edu"
            # Potential issue: emails are not normalized
            # These are technically the same email addresses
        finally:
            os.unlink(temp_path)

    def test_roll_no_with_special_characters(self):
        """Test roll numbers with underscores and special chars."""
        content = (
            "roll_no,college_mail,name,is_paid\n"
            "ROLL001_,student1@college.edu,John Doe,true\n"
            "ROLL_002,student2@college.edu,Jane Smith,true\n"
            " ROLL003 ,student3@college.edu,Bob Wilson,true\n"
        )

        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
            f.write(content)
            temp_path = f.name

        try:
            recipients = read_recipients(temp_path)
            # Current behavior: preserves special chars and strips whitespace
            assert recipients[0]["roll_no"] == "ROLL001_"  # Underscore preserved
            assert recipients[1]["roll_no"] == "ROLL_002"  # Underscore preserved
            assert recipients[2]["roll_no"] == "ROLL003"  # Whitespace stripped
        finally:
            os.unlink(temp_path)

    def test_name_with_carriage_returns(self):
        """Test names with carriage returns and newlines."""
        content = (
            "roll_no,college_mail,name,is_paid\n"
            "ROLL001,student1@college.edu,John Doe\r\n,true\n"
            "ROLL002,student2@college.edu,Jane Smith\r,true\n"
            "ROLL003,student3@college.edu,Bob Wilson\n,true\n"
        )

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".csv", newline="", delete=False
        ) as f:
            f.write(content)
            temp_path = f.name

        try:
            recipients = read_recipients(temp_path)
            # Potential issue: carriage returns in names
            # This could cause display issues in emails
            for r in recipients:
                # Names should not contain carriage returns or newlines
                assert "\r" not in r["name"], (
                    f"Name contains carriage return: {repr(r['name'])}"
                )
                assert "\n" not in r["name"], (
                    f"Name contains newline: {repr(r['name'])}"
                )
        finally:
            os.unlink(temp_path)

    def test_name_with_tabs_and_multiple_spaces(self):
        """Test names with tabs and multiple consecutive spaces."""
        content = (
            "roll_no,college_mail,name,is_paid\n"
            "ROLL001,student1@college.edu,John\tDoe,true\n"
            "ROLL002,student2@college.edu,Jane  Smith,true\n"
            "ROLL003,student3@college.edu,Bob\t\tWilson,true\n"
        )

        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
            f.write(content)
            temp_path = f.name

        try:
            recipients = read_recipients(temp_path)
            # Tabs are preserved - should they be normalized to spaces?
            assert "\t" in recipients[0]["name"]
            assert "  " in recipients[1]["name"]  # Multiple spaces preserved
        finally:
            os.unlink(temp_path)

    def test_empty_and_null_values(self):
        """Test handling of empty and null-like values."""
        content = (
            "roll_no,college_mail,name,is_paid\n"
            "ROLL001,student1@college.edu,,true\n"  # Empty name
            "ROLL002,,Jane Smith,true\n"  # Empty email - should be skipped
            ",student3@college.edu,Bob Wilson,true\n"  # Empty roll_no - should be skipped
            "ROLL004,student4@college.edu,John Doe,\n"  # Empty is_paid
            "ROLL005,student5@college.edu,Jane,null\n"  # "null" as string
            "ROLL006,student6@college.edu,Bob,\t\n"  # Tab as is_paid
        )

        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
            f.write(content)
            temp_path = f.name

        try:
            recipients = read_recipients(temp_path)
            # Check which records were included
            roll_nos = [r["roll_no"] for r in recipients]

            # Empty name is allowed
            assert "ROLL001" in roll_nos
            # Empty email should be skipped
            assert "ROLL002" not in roll_nos
            # Empty roll_no should be skipped
            assert "" not in [r["roll_no"] for r in recipients]
            # Check empty is_paid defaults to False
            roll004 = next((r for r in recipients if r["roll_no"] == "ROLL004"), None)
            assert roll004 is not None
            assert roll004["is_paid"] is False
        finally:
            os.unlink(temp_path)

    def test_boolean_edge_cases(self):
        """Test various boolean representations."""
        content = (
            "roll_no,college_mail,name,is_paid\n"
            "ROLL001,student1@college.edu,John,TRUE\n"
            "ROLL002,student2@college.edu,Jane,FALSE\n"
            "ROLL003,student3@college.edu,Bob,True\n"
            "ROLL004,student4@college.edu,Alice,False\n"
            "ROLL005,student5@college.edu,Charlie,YES\n"
            "ROLL006,student6@college.edu,Diana,NO\n"
            "ROLL007,student7@college.edu,Eve,1\n"
            "ROLL008,student8@college.edu,Frank,0\n"
            "ROLL009,student9@college.edu,Grace,yes\n"
            "ROLL010,student10@college.edu,Henry,no\n"
            "ROLL011,student11@college.edu,Ivy,paid\n"
            "ROLL012,student12@college.edu,Jack,unpaid\n"
            "ROLL013,student13@college.edu,Kelly,$\n"
            "ROLL014,student14@college.edu,Leo,✓\n"
            "ROLL015,student15@college.edu,Mia,x\n"
        )

        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
            f.write(content)
            temp_path = f.name

        try:
            recipients = read_recipients(temp_path)

            # Check boolean parsing
            # Note: All values are lowercased before checking
            # Accepted: "true", "1", "yes", "paid"
            bool_tests = [
                ("ROLL001", True),  # TRUE -> "true" ✓
                ("ROLL002", False),  # FALSE -> "false" ✗
                ("ROLL003", True),  # True -> "true" ✓
                ("ROLL004", False),  # False -> "false" ✗
                ("ROLL005", True),  # YES -> "yes" ✓
                ("ROLL006", False),  # NO -> "no" ✗
                ("ROLL007", True),  # 1 ✓
                ("ROLL008", False),  # 0 ✗
                ("ROLL009", True),  # yes ✓
                ("ROLL010", False),  # no ✗
                ("ROLL011", True),  # paid ✓
                ("ROLL012", False),  # unpaid ✗
                ("ROLL013", False),  # $ ✗
                ("ROLL014", False),  # ✓ ✗
                ("ROLL015", False),  # x ✗
            ]

            for roll_no, expected in bool_tests:
                recipient = next(
                    (r for r in recipients if r["roll_no"] == roll_no), None
                )
                assert recipient is not None, f"Recipient {roll_no} not found"
                assert recipient["is_paid"] == expected, (
                    f"{roll_no}: expected {expected}, got {recipient['is_paid']}"
                )
        finally:
            os.unlink(temp_path)

    def test_whitespace_variations_in_boolean(self):
        """Test boolean parsing with various whitespace."""
        content = (
            "roll_no,college_mail,name,is_paid\n"
            "ROLL001,student1@college.edu,John, true \n"
            "ROLL002,student2@college.edu,Jane,\tfalse\n"
            "ROLL003,student3@college.edu,Bob,\t\tTRUE\t\t\n"
            "ROLL004,student4@college.edu,Alice,  1  \n"
        )

        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
            f.write(content)
            temp_path = f.name

        try:
            recipients = read_recipients(temp_path)

            assert recipients[0]["is_paid"] is True  # " true "
            assert recipients[1]["is_paid"] is False  # "\tfalse"
            assert recipients[2]["is_paid"] is True  # "\t\tTRUE\t\t"
            assert recipients[3]["is_paid"] is True  # "  1  "
        finally:
            os.unlink(temp_path)

    def test_unicode_in_names(self):
        """Test handling of unicode characters in names."""
        content = (
            "roll_no,college_mail,name,is_paid\n"
            "ROLL001,student1@college.edu,José García,true\n"
            "ROLL002,student2@college.edu,张明,true\n"
            "ROLL003,student3@college.edu,Привет,true\n"
            "ROLL004,student4@college.edu,O'Connor,true\n"
        )

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".csv", encoding="utf-8", delete=False
        ) as f:
            f.write(content)
            temp_path = f.name

        try:
            recipients = read_recipients(temp_path)

            assert recipients[0]["name"] == "José García"
            assert recipients[1]["name"] == "张明"
            assert recipients[2]["name"] == "Привет"
            assert recipients[3]["name"] == "O'Connor"
        finally:
            os.unlink(temp_path)

    def test_column_name_variations(self):
        """Test various column name formats."""
        test_cases = [
            # Standard format
            (
                "roll_no,college_mail,name,is_paid\nROLL001,student1@college.edu,John,true\n",
                "standard",
            ),
            # Title case
            (
                "Roll_no,College_mail,Name,Is_paid\nROLL002,student2@college.edu,Jane,true\n",
                "title",
            ),
            # With spaces
            (
                "Roll no,College Mail,Name,Is Paid\nROLL003,student3@college.edu,Bob,true\n",
                "spaces",
            ),
            # All caps
            (
                "ROLL_NO,COLLEGE_MAIL,NAME,IS_PAID\nROLL004,student4@college.edu,Alice,true\n",
                "caps",
            ),
        ]

        for content, case_name in test_cases:
            with tempfile.NamedTemporaryFile(
                mode="w", suffix=".csv", delete=False
            ) as f:
                f.write(content)
                temp_path = f.name

            try:
                recipients = read_recipients(temp_path)
                assert len(recipients) == 1, f"Failed for {case_name}"
                assert recipients[0]["is_paid"] is True
            finally:
                os.unlink(temp_path)

    def test_duplicate_roll_numbers(self):
        """Test handling of duplicate roll numbers."""
        content = (
            "roll_no,college_mail,name,is_paid\n"
            "ROLL001,student1@college.edu,John Doe,true\n"
            "ROLL001,student1@college.edu,John Doe,true\n"  # Duplicate
            "ROLL002,student2@college.edu,Jane Smith,true\n"
        )

        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
            f.write(content)
            temp_path = f.name

        try:
            recipients = read_recipients(temp_path)
            # Currently duplicates are not filtered - should they be?
            roll_nos = [r["roll_no"] for r in recipients]
            assert roll_nos.count("ROLL001") == 2  # Both duplicates included
        finally:
            os.unlink(temp_path)

    def test_very_long_fields(self):
        """Test handling of very long field values."""
        long_name = "A" * 1000
        long_email = "a" * 200 + "@college.edu"
        long_roll = "R" * 100

        content = (
            f"roll_no,college_mail,name,is_paid\n"
            f"{long_roll},{long_email},{long_name},true\n"
        )

        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
            f.write(content)
            temp_path = f.name

        try:
            recipients = read_recipients(temp_path)
            assert len(recipients) == 1
            assert recipients[0]["roll_no"] == long_roll
            assert recipients[0]["email"] == long_email
            assert recipients[0]["name"] == long_name
        finally:
            os.unlink(temp_path)


class TestDataQualityIssues:
    """Tests to identify data quality issues in real-world usage."""

    def test_detect_carriage_return_in_csv_data(self):
        """Test that we can detect carriage returns in actual CSV data."""
        # Simulating the issue seen in real CSV
        content = (
            "roll_no,college_mail,name,is_paid\n"
            "ROLL001,student1@college.edu,Amirdha Varshini N\r,true\n"
        )

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".csv", newline="", delete=False
        ) as f:
            f.write(content)
            temp_path = f.name

        try:
            recipients = read_recipients(temp_path)
            # This test documents the current behavior
            # If the name contains \r, it could cause issues
            name = recipients[0]["name"]
            if "\r" in name:
                pytest.fail(f"Name contains carriage return character: {repr(name)}")
        finally:
            os.unlink(temp_path)

    def test_email_domain_validation(self):
        """Test that emails have valid domain structure."""
        content = (
            "roll_no,college_mail,name,is_paid\n"
            "ROLL001,student1@college.edu,John,true\n"
            "ROLL002,invalid-email,Jane,true\n"  # Invalid email
            "ROLL003,student3@,Bob,true\n"  # Missing domain
            "ROLL004,@college.edu,Alice,true\n"  # Missing local part
            "ROLL005,plainaddress,Charlie,true\n"  # No @ symbol
        )

        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
            f.write(content)
            temp_path = f.name

        try:
            recipients = read_recipients(temp_path)
            # Currently all are accepted - should we validate emails?
            emails = [r["email"] for r in recipients]
            assert "student1@college.edu" in emails
            # These are all accepted currently:
            assert "invalid-email" in emails
            assert "student3@" in emails
            assert "@college.edu" in emails
            assert "plainaddress" in emails
        finally:
            os.unlink(temp_path)

    def test_paid_field_inconsistent_formats(self):
        """Test that 'YES' and 'NO' are not treated as boolean."""
        content = (
            "roll_no,college_mail,name,is_paid\n"
            "ROLL001,student1@college.edu,John,YES\n"
            "ROLL002,student2@college.edu,Jane,NO\n"
            "ROLL003,student3@college.edu,Bob,yes\n"
            "ROLL004,student4@college.edu,Alice,no\n"
        )

        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
            f.write(content)
            temp_path = f.name

        try:
            recipients = read_recipients(temp_path)

            # After fix: "YES" and "yes" are both accepted (case-insensitive)
            roll001 = next((r for r in recipients if r["roll_no"] == "ROLL001"), None)
            roll002 = next((r for r in recipients if r["roll_no"] == "ROLL002"), None)
            roll003 = next((r for r in recipients if r["roll_no"] == "ROLL003"), None)
            roll004 = next((r for r in recipients if r["roll_no"] == "ROLL004"), None)

            # All lookups should succeed
            assert roll001 is not None
            assert roll002 is not None
            assert roll003 is not None
            assert roll004 is not None

            # "YES" -> "yes" -> True (case insensitive matching)
            assert roll001["is_paid"] is True
            # "NO" -> "no" -> False (not in accepted list)
            assert roll002["is_paid"] is False
            # "yes" -> "yes" -> True
            assert roll003["is_paid"] is True
            # "no" -> "no" -> False (not in accepted list)
            assert roll004["is_paid"] is False
        finally:
            os.unlink(temp_path)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
