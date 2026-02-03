"""CSV reader module for reading recipient data."""

import csv
import os
from pathlib import Path
from typing import List, Dict, Any


def _get_field(row: Dict[str, str], possible_names: list) -> str:
    """Get field value from row using multiple possible column names."""
    for name in possible_names:
        if name in row:
            value = row[name]
            # Handle None values and remove carriage returns
            if value is None:
                return ""
            # Clean carriage returns from the value
            return value.replace("\r", "")
    return ""


def read_recipients(csv_path: str) -> List[Dict[str, Any]]:
    """Read recipients from CSV file.

    Expected CSV formats:
    - roll_no,college_mail,name,is_paid
    - Roll_no,College_mail,Name,is_paid
    - Roll no,College Mail,Name,is_paid

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
            is_paid_str = (
                _get_field(row, ["is_paid", "Is_paid", "Is Paid", "IS_PAID"])
                .strip()
                .lower()
            )
            is_paid = is_paid_str in ("true", "1", "yes", "paid")

            # Get fields with flexible column names
            roll_no = _get_field(
                row,
                [
                    "roll_no",
                    "Roll_no",
                    "Roll no",
                    "roll no",
                    "ROLL_NO",
                    "Roll No",
                    "ROLL NO",
                ],
            ).strip()
            email = _get_field(
                row,
                [
                    "college_mail",
                    "College_mail",
                    "College Mail",
                    "email",
                    "COLLEGE_MAIL",
                    "COLLEGE MAIL",
                    "College_Mail",
                    "clg mail",
                    "Clg mail",
                    "Clg Mail",
                    "CLG MAIL",
                ],
            ).strip()
            name = _get_field(row, ["name", "Name", "NAME"]).strip()

            recipient = {
                "roll_no": roll_no,
                "email": email,
                "name": name,
                "is_paid": is_paid,
            }

            # Skip if roll_no or email is empty
            if not recipient["roll_no"] or not recipient["email"]:
                continue

            recipients.append(recipient)

    return recipients


def read_recipients_from_directory(directory_path: str) -> List[Dict[str, Any]]:
    """Read recipients from all CSV files in a directory.

    Args:
        directory_path: Path to the directory containing CSV files

    Returns:
        List of recipient dictionaries from all CSV files (deduplicated by roll_no)

    Raises:
        FileNotFoundError: If the directory doesn't exist
        ValueError: If no CSV files are found in the directory
    """
    dir_path = Path(directory_path)

    if not dir_path.exists():
        raise FileNotFoundError(f"Directory not found: {directory_path}")

    if not dir_path.is_dir():
        raise ValueError(f"Path is not a directory: {directory_path}")

    # Find all CSV files in the directory
    csv_files = list(dir_path.glob("*.csv"))

    if not csv_files:
        raise ValueError(f"No CSV files found in directory: {directory_path}")

    all_recipients = []
    seen_roll_nos = set()

    for csv_file in sorted(csv_files):
        try:
            recipients = read_recipients(str(csv_file))
            # Deduplicate by roll_no (keep first occurrence)
            for recipient in recipients:
                if recipient["roll_no"] not in seen_roll_nos:
                    seen_roll_nos.add(recipient["roll_no"])
                    all_recipients.append(recipient)
        except Exception as e:
            # Log warning but continue with other files
            print(f"Warning: Failed to read {csv_file.name}: {e}")
            continue

    return all_recipients
