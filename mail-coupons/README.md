# Mail Coupons - Registration Coupon Sender

A Python application to send registration coupon emails to recipients from a CSV file.

## Requirements

- Python 3.14+
- [UV](https://github.com/astral-sh/uv) 

## Installation

1. Clone the repository and navigate to the directory:
```bash
cd mail-coupons
```

2. Install dependencies using UV:
```bash
uv sync
```

## CSV File Format

The input CSV file should have the following format:

```csv
roll_no,clg mail,name,is_paid
ROLL001,student1@college.edu,John Doe,true
ROLL002,student2@college.edu,Jane Smith,false
```

**Columns:**
- `roll_no`: Student's roll number (used as unique identifier)
- `clg mail`: Student's email address
- `name`: Student's full name
- `is_paid`: Payment status (true/false)


## Usage

### Basic Usage

Run the application with a CSV file:

```bash
uv run python main.py sample-data.csv --smtp-username YOUR_SMTP_USERNAME
```

The application will prompt you for:
- Username (for API authentication)
- Password (for API authentication)
- SMTP password

### Full Command Line Options

```bash
uv run python main.py [OPTIONS] CSV_FILE

Options:
  --username TEXT              Username for login authentication
  --password TEXT              Password for login authentication
  --smtp-username TEXT         SMTP username for email sending [required]
  --smtp-password TEXT         SMTP password for email sending
  --db-path TEXT              Path to SQLite database (default: mail_coupons.db)
  --api-endpoint TEXT         API endpoint for creating coupons
  --from-email TEXT           From email address
  --smtp-host TEXT            SMTP server hostname
  --smtp-port INTEGER         SMTP server port
  --register-url TEXT         Registration URL
  --help                      Show this message and exit
```

### Example with All Options

```bash
uv run python main.py sample-data.csv \
  --username admin \
  --password mypassword \
  --smtp-username AKIAXXXXXXXXX \
  --smtp-password mysmtppassword \
  --db-path ./tracking.db \
  --api-endpoint https://app.melinia.in/api/v1/coupons \
  --from-email onboard@melinia.dev \
  --smtp-host email-smtp.ap-south-1.amazonaws.com \
  --smtp-port 587
```

## Development

### Running Tests

The project follows Test-Driven Development (TDD). Run all tests with:

```bash
uv run pytest -v
```

Run specific test files:
```bash
uv run pytest tests/test_csv_reader.py -v
uv run pytest tests/test_database.py -v
uv run pytest tests/test_login.py -v
uv run pytest tests/test_email_sender.py -v
uv run pytest tests/test_main.py -v
```

### Project Structure

```
mail-coupons/
├── src/
│   └── mail_coupons/
│       ├── __init__.py
│       ├── csv_reader.py      # CSV file reading
│       ├── database.py        # SQLite database operations
│       ├── login.py           # Authentication
│       └── email_sender.py    # Email sending & coupon creation
├── tests/
│   ├── test_csv_reader.py
│   ├── test_database.py
│   ├── test_login.py
│   ├── test_email_sender.py
│   └── test_main.py
├── main.py                    # CLI application entry point
├── sample-data.csv           # Sample CSV file
├── pyproject.toml           # Project dependencies
└── README.md                # This file
```

### Adding New Features

Follow the TDD approach:

1. **Red**: Write a failing test
2. **Green**: Implement the feature to make the test pass
3. **Refactor**: Improve the code while keeping tests passing

## Environment Variables

Default configuration:
- API Endpoint: `https://app.melinia.in/api/v1/coupons`
- Login URL: `http://localhost:3000/v1/api/login`
- From Email: `onboard@melinia.dev`
- SMTP Host: `email-smtp.ap-south-1.amazonaws.com`
- SMTP Port: `587`
- Register URL: `https://melinia.in/register`

All of these can be overridden via command-line options.

## Troubleshooting

### Authentication Failed
- Ensure the login API is running at `localhost:3000`
- Verify your username and password are correct

### Email Sending Failed
- Check your SMTP credentials
- Verify SMTP host and port are correct
- Ensure your SMTP service allows sending from the `from-email` address

### Database Locked
- Close any other processes accessing the database
- Check file permissions on the database file

