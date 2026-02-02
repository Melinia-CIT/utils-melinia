"""Login functionality for authentication."""

import requests

DEFAULT_LOGIN_URL = "http://localhost:3000/v1/api/login"


def authenticate_user(username: str, password: str, login_url: str = None) -> str:
    """Authenticate user with credentials and return bearer token.

    Args:
        username: The username for login
        password: The password for login
        login_url: Optional custom login URL (defaults to localhost:3000/v1/api/login)

    Returns:
        The bearer token string

    Raises:
        Exception: If login fails with any error
    """
    if login_url is None:
        login_url = DEFAULT_LOGIN_URL

    try:
        response = requests.post(
            login_url, json={"email": username, "passwd": password}
        )

        if response.status_code == 200:
            data = response.json()
            return data.get("accessToken")
        else:
            raise Exception(
                f"Login failed (HTTP {response.status_code}): {response.text}"
            )
    except Exception as e:
        raise Exception(f"Login failed: {str(e)}")
