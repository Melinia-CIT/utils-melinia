"""Database module for tracking sent emails."""

import sqlite3
from typing import List, Dict, Any


class Database:
    """SQLite database for tracking email recipients."""

    def __init__(self, db_path: str = "mail_coupons.db"):
        """Initialize database connection and create table if not exists.

        Args:
            db_path: Path to the SQLite database file
        """
        self.db_path = db_path
        self._init_table()

    def _init_table(self):
        """Create the sent_emails table if it doesn't exist."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sent_emails (
                roll_no TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                name TEXT NOT NULL,
                is_paid BOOLEAN NOT NULL,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()

    def email_already_sent(self, roll_no: str) -> bool:
        """Check if an email has already been sent to this roll number.

        Args:
            roll_no: The roll number to check

        Returns:
            True if email has been sent, False otherwise
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM sent_emails WHERE roll_no = ?", (roll_no,))
        result = cursor.fetchone()
        conn.close()
        return result is not None

    def mark_email_sent(self, roll_no: str, email: str, name: str, is_paid: bool):
        """Mark an email as sent by recording it in the database.

        Args:
            roll_no: The recipient's roll number
            email: The recipient's email address
            name: The recipient's name
            is_paid: Whether the recipient has paid
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT OR REPLACE INTO sent_emails (roll_no, email, name, is_paid)
            VALUES (?, ?, ?, ?)
        """,
            (roll_no, email, name, is_paid),
        )
        conn.commit()
        conn.close()

    def get_unsent_recipients(
        self, all_recipients: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Filter recipients to only those who haven't received emails.

        Args:
            all_recipients: List of recipient dictionaries with roll_no, email, name, is_paid

        Returns:
            List of recipients who haven't received emails yet
        """
        return [
            recipient
            for recipient in all_recipients
            if not self.email_already_sent(recipient["roll_no"])
        ]

    def close(self):
        """Close database connection."""
        pass
