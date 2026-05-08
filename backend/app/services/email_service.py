from __future__ import annotations

import asyncio
import logging
import smtplib
from email.message import EmailMessage
from typing import Any

from app.core.config import settings


logger = logging.getLogger(__name__)

BLOCKED_TEST_DOMAINS = {
    "example.com",
    "example.net",
    "example.org",
    "invalid",
    "localhost",
    "test",
}


def mask_email(email: str) -> str:
    local, separator, domain = email.partition("@")
    if not separator:
        return "***"
    visible = local[:2] if len(local) > 2 else local[:1]
    return f"{visible}***@{domain}"


def smtp_ready() -> bool:
    values = [
        settings.effective_smtp_username,
        settings.effective_smtp_password,
        settings.effective_smtp_from_email,
        settings.effective_smtp_host,
    ]
    return all(values) and not any("garbage" in value.lower() for value in values)


def _sender_email() -> str:
    username = settings.effective_smtp_username
    from_email = settings.effective_smtp_from_email
    if settings.effective_smtp_host.lower() == "smtp.gmail.com" and username.endswith("@gmail.com"):
        return username
    return from_email


def _send_smtp(email: str, otp: str) -> dict[str, Any]:
    sender = _sender_email()
    message = EmailMessage()
    message["Subject"] = f"{otp} is your Travel Companion verification code"
    message["From"] = sender
    message["To"] = email
    message["Reply-To"] = sender
    message["X-Application"] = settings.app_name
    message["Auto-Submitted"] = "auto-generated"
    message.set_content(
        f"""
Your Travel Companion verification code is {otp}.

Enter this code in the login screen. If you did not request this code, you can ignore this email.
        """.strip()
    )
    message.add_alternative(
        f"""
        <html>
          <body>
            <p>Your Travel Companion verification code is:</p>
            <h1>{otp}</h1>
            <p>Enter this code in the login screen. If you did not request this code, you can ignore this email.</p>
          </body>
        </html>
        """,
        subtype="html",
    )

    host = settings.effective_smtp_host
    port = settings.effective_smtp_port
    username = settings.effective_smtp_username
    password = settings.effective_smtp_password

    if port == 465:
        with smtplib.SMTP_SSL(host, port, timeout=20) as smtp:
            smtp.login(username, password)
            refused = smtp.send_message(message)
    else:
        with smtplib.SMTP(host, port, timeout=20) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.ehlo()
            smtp.login(username, password)
            refused = smtp.send_message(message)

    if refused:
        return {"status": "failed", "reason": f"SMTP recipient refused: {refused}"}

    return {
        "status": "sent",
        "provider": host,
        "from": mask_email(sender),
        "to": mask_email(email),
        "accepted": True,
    }


async def send_otp_email(email: str, otp: str) -> dict[str, Any]:
    domain = email.rsplit("@", 1)[-1].lower() if "@" in email else ""
    if settings.environment == "development" and domain in BLOCKED_TEST_DOMAINS:
        skipped = {
            "status": "skipped",
            "reason": "Development test address skipped; no SMTP message was sent.",
        }
        logger.info("OTP email skipped for %s: %s", mask_email(email), skipped["reason"])
        return skipped

    if not smtp_ready():
        return {"status": "failed", "reason": "SMTP credentials are not configured yet."}

    try:
        result = await asyncio.to_thread(_send_smtp, email, otp)
        logger.info("OTP email delivery result for %s: %s", mask_email(email), result)
        return result
    except smtplib.SMTPAuthenticationError:
        return {
            "status": "failed",
            "reason": "SMTP authentication failed. For Gmail, use a Google App Password with 2-Step Verification enabled.",
        }
    except smtplib.SMTPRecipientsRefused as exc:
        return {"status": "failed", "reason": f"Recipient email was refused: {exc.recipients}"}
    except smtplib.SMTPSenderRefused as exc:
        return {"status": "failed", "reason": f"Sender email was refused: {exc.smtp_error!r}"}
    except smtplib.SMTPResponseException as exc:
        return {"status": "failed", "reason": f"SMTP error {exc.smtp_code}: {exc.smtp_error!r}"}
    except Exception as exc:
        return {"status": "failed", "reason": f"SMTP send failed: {exc}"}
