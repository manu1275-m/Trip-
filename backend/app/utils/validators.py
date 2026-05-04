import re

def validate_email(email: str) -> bool:
    """
    Validate email format
    """
    pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return re.match(pattern, email) is not None


def validate_password(password: str) -> bool:
    """
    Password rules:
    - At least 6 chars
    """
    return len(password) >= 6


def validate_location(text: str) -> bool:
    """
    Basic validation for place names
    """
    return isinstance(text, str) and len(text.strip()) > 2


def validate_days(days: int) -> bool:
    """
    Trip days validation
    """
    return isinstance(days, int) and 1 <= days <= 30