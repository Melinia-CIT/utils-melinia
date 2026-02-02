#!/usr/bin/env python3
"""Tests for SQLite database operations."""

import pytest
import sqlite3
import tempfile
import os
from mail_coupons.database import Database


class TestDatabase:
    """Test cases for database operations."""

    @pytest.fixture
    def temp_db(self):
        """Create a temporary database for testing."""
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            temp_path = f.name
        db = Database(temp_path)
        yield db
        # Cleanup
        db.close()
        os.unlink(temp_path)

    def test_database_init_creates_table(self, temp_db):
        """Test database initialization creates sent_emails table."""
        # Verify table was created by querying it
        conn = sqlite3.connect(temp_db.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='sent_emails'"
        )
        result = cursor.fetchone()
        conn.close()
        assert result is not None
        assert result[0] == "sent_emails"

    def test_email_already_sent_returns_false_for_new_entry(self, temp_db):
        """Test email_already_sent returns False for non-existent roll_no."""
        assert temp_db.email_already_sent("ROLL123") is False

    def test_mark_email_sent_adds_entry(self, temp_db):
        """Test mark_email_sent adds entry to database."""
        temp_db.mark_email_sent("ROLL123", "test@example.com", "John Doe", True)
        assert temp_db.email_already_sent("ROLL123") is True

    def test_get_unsent_emails_filters_correctly(self, temp_db):
        """Test get_unsent_emails returns only unsent entries."""
        all_recipients = [
            {
                "roll_no": "ROLL001",
                "email": "test1@example.com",
                "name": "User One",
                "is_paid": True,
            },
            {
                "roll_no": "ROLL002",
                "email": "test2@example.com",
                "name": "User Two",
                "is_paid": False,
            },
            {
                "roll_no": "ROLL003",
                "email": "test3@example.com",
                "name": "User Three",
                "is_paid": True,
            },
        ]

        # Mark one email as sent
        temp_db.mark_email_sent("ROLL002", "test2@example.com", "User Two", False)

        unsent = temp_db.get_unsent_recipients(all_recipients)

        assert len(unsent) == 2
        assert unsent[0]["roll_no"] == "ROLL001"
        assert unsent[1]["roll_no"] == "ROLL003"

    def test_get_unsent_emails_empty_list(self, temp_db):
        """Test get_unsent_emails returns empty list when all sent."""
        all_recipients = [
            {
                "roll_no": "ROLL001",
                "email": "test1@example.com",
                "name": "User One",
                "is_paid": True,
            },
        ]

        # Mark email as sent
        temp_db.mark_email_sent("ROLL001", "test1@example.com", "User One", True)

        unsent = temp_db.get_unsent_recipients(all_recipients)

        assert len(unsent) == 0

    def test_mark_email_sent_prevents_duplicates(self, temp_db):
        """Test marking same email twice doesn't create duplicates."""
        temp_db.mark_email_sent("ROLL001", "test1@example.com", "User One", True)
        temp_db.mark_email_sent("ROLL001", "test1@example.com", "User One", True)

        conn = sqlite3.connect(temp_db.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM sent_emails WHERE roll_no = 'ROLL001'")
        count = cursor.fetchone()[0]
        conn.close()

        assert count == 1
