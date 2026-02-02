"""CSV reader module for reading recipient data."""

import csv
from typing import List, Dict, Any


def read_recipients(csv_path: str) -> List[Dict[str, Any]]:
    """Read recipients from CSV file.

    Expected CSV format:
    roll_no,clg mail,name,is_paid

    Args:
        csv_path: Path to the CSV file

    Returns:
        List of recipient dictionaries

    Raises:
        FileNotFoundError: If the file doesn't exist
    """
    recipients = []

    with open(csv_path, "r", newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)

        for row in reader:
            # Skip empty rows
            if not any(row.values()):
                continue

            # Parse is_paid boolean
            is_paid_str = row.get("is_paid", "").strip().lower()
            is_paid = is_paid_str in ("true", "1", "yes", "paid")

            recipient = {
                "roll_no": row.get("roll_no", "").strip(),
                "email": row.get("clg mail", "").strip(),
                "name": row.get("name", "").strip(),
                "is_paid": is_paid,
            }

            # Skip if roll_no or email is empty
            if not recipient["roll_no"] or not recipient["email"]:
                continue

            recipients.append(recipient)

    return recipients
