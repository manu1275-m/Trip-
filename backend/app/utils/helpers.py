from datetime import datetime

def format_response(data, message="Success"):
    """
    Standard API response format
    """
    return {
        "status": "success",
        "message": message,
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    }


def format_error(message="Something went wrong"):
    """
    Standard error response
    """
    return {
        "status": "error",
        "message": message,
        "data": None,
        "timestamp": datetime.utcnow().isoformat()
    }


def clean_text(text: str):
    """
    Basic text cleaning (used for inputs / LLM / API)
    """
    return text.strip().replace("\n", " ").replace("  ", " ")