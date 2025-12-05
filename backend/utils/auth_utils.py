import os
import hmac
import time
import base64
import secrets
import hashlib
from uuid import UUID
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

AUTH_SECRET = (os.getenv("AUTH_SECRET") or "dev-secret-change-me").encode()


def hash_password(password: str) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256 with a random salt.

    Returns a string containing the algorithm, iterations, salt and hash.
    Format: pbkdf2_sha256$<iters>$<salt_hex>$<hash_hex>
    """
    if not isinstance(password, str):
        raise TypeError("password must be a string")
    salt = secrets.token_bytes(16)
    iterations = 200_000
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, iterations)
    return f"pbkdf2_sha256${iterations}${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algo, iters_s, salt_hex, hash_hex = stored.split("$")
        if algo != "pbkdf2_sha256":
            return False
        iterations = int(iters_s)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(hash_hex)
        dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, iterations)
        return hmac.compare_digest(dk, expected)
    except Exception:
        return False


def make_token(user_id: UUID) -> str:
    """Create a simple HMAC-signed token for the user.

    Format: base64(user_id|ts|sig) where sig = HMAC(secret, user_id|ts)
    """
    ts = str(int(time.time()))
    payload = f"{user_id}|{ts}".encode()
    sig = hmac.new(AUTH_SECRET, payload, hashlib.sha256).digest()
    blob = payload + b"|" + sig
    return base64.urlsafe_b64encode(blob).decode().rstrip("=")


def verify_token(token: str) -> Optional[UUID]:
    """Verify HMAC token and return user_id if valid, else None."""
    if not token:
        return None
    try:
        # Pad base64
        pad = '=' * (-len(token) % 4)
        raw = base64.urlsafe_b64decode(token + pad)
        parts = raw.split(b"|")
        if len(parts) != 3:
            return None
        user_id_b, ts_b, sig = parts
        payload = user_id_b + b"|" + ts_b
        expected = hmac.new(AUTH_SECRET, payload, hashlib.sha256).digest()
        if not hmac.compare_digest(sig, expected):
            return None
        # Optional: reject very old tokens. For now, accept indefinitely.
        # ts = int(ts_b.decode())
        uid = UUID(user_id_b.decode())
        return uid
    except Exception:
        return None
