"""Login functionality for authentication."""

import requests

LOGIN_URL = "http://localhost:3000/v1/api/login"


def authenticate_user(username: str, password: str) -> str:
    """Authenticate user with credentials and return bearer token.

    Args:
        username: The username for login
        password: The password for login

    Returns:
        The bearer token string

    Raises:
        Exception: If login fails with any error
    """
    try:
        response = requests.post(
            LOGIN_URL, json={"username": username, "password": password}
        )

        if response.status_code == 200:
            data = response.json()
            return data.get("token")
        else:
            raise Exception(
                f"Login failed (HTTP {response.status_code}): {response.text}"
            )
    except Exception as e:
        raise Exception(f"Login failed: {str(e)}")
