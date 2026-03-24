"""
Email service — sends credentials email to newly created candidates.
Uses standard library smtplib with STARTTLS.
Falls back silently when SMTP_USER is not configured (dev mode).
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger(__name__)


def _build_message(to_email: str, full_name: str, password: str) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your Effort Tracker Account"
    msg["From"]    = settings.EMAIL_FROM
    msg["To"]      = to_email

    text = f"""Hi {full_name},

Your account for Effort Tracker has been created.

Login URL : {settings.APP_URL}/auth/login
Email     : {to_email}
Password  : {password}

Please change your password after first login.

Regards,
Effort Tracker Team
"""
    html = f"""<html><body>
<p>Hi <strong>{full_name}</strong>,</p>
<p>Your account for <strong>Effort Tracker</strong> has been created.</p>
<table cellpadding="6" style="border-collapse:collapse">
  <tr><td><b>Login URL</b></td><td><a href="{settings.APP_URL}/auth/login">{settings.APP_URL}/auth/login</a></td></tr>
  <tr><td><b>Email</b></td><td>{to_email}</td></tr>
  <tr><td><b>Password</b></td><td><code>{password}</code></td></tr>
</table>
<p>Please change your password after first login.</p>
<p>Regards,<br>Effort Tracker Team</p>
</body></html>"""

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html,  "html"))
    return msg


def send_credentials_email(to_email: str, full_name: str, plain_password: str) -> None:
    """Send login credentials to a new candidate. No-op when SMTP is not configured."""
    if not settings.SMTP_USER:
        logger.info("SMTP not configured — skipping credentials email for %s", to_email)
        return

    try:
        msg = _build_message(to_email, full_name, plain_password)
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, [to_email], msg.as_string())
        logger.info("Credentials email sent to %s", to_email)
    except Exception as exc:
        # Log but do not raise — email failure must not block candidate creation
        logger.error("Failed to send credentials email to %s: %s", to_email, exc)
