"""
evidence_engine.signatures
--------------------------
Handles Ed25519 digital signature creation and verification for AEGISX Sentinel.
"""

from typing import Tuple
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric import ed25519

try:
    from evidence_engine.canonical import canonicalize_event
except ImportError:
    from canonical import canonicalize_event


def generate_key_pair() -> Tuple[ed25519.Ed25519PrivateKey, ed25519.Ed25519PublicKey]:
    """Generate an in-memory Ed25519 private and public key pair for development and testing.

    Returns:
        tuple: (private_key, public_key)

    Security Note:
        Private keys are kept in memory only and never saved to disk or printed.
    """
    private_key = ed25519.Ed25519PrivateKey.generate()
    public_key = private_key.public_key()
    return private_key, public_key


def sign_event(event: dict, private_key: ed25519.Ed25519PrivateKey) -> bytes:
    """Sign an event dictionary using an Ed25519 private key.

    Uses canonicalize_event so that the event dictionary produces deterministic bytes
    before signing.

    Args:
        event: The event data dictionary.
        private_key: The Ed25519PrivateKey to sign the event with.

    Returns:
        bytes: The 64-byte raw digital signature.

    Raises:
        TypeError: If private_key is not an Ed25519PrivateKey.
        ValueError: If event cannot be serialized.
    """
    if not isinstance(private_key, ed25519.Ed25519PrivateKey):
        raise TypeError("private_key must be an instance of ed25519.Ed25519PrivateKey")

    event_bytes = canonicalize_event(event)
    return private_key.sign(event_bytes)


def verify_event_signature(
    event: dict,
    signature: bytes,
    public_key: ed25519.Ed25519PublicKey
) -> bool:
    """Verify an event's digital signature using an Ed25519 public key.

    Args:
        event: The event dictionary that was signed.
        signature: The signature bytes (or hex string) to verify.
        public_key: The Ed25519PublicKey to verify against.

    Returns:
        bool: True if signature is valid and untampered, False otherwise.
              Invalid signatures fail safely without crashing.
    """
    if not isinstance(public_key, ed25519.Ed25519PublicKey):
        return False

    # Allow hex string or raw bytes for flexibility
    if isinstance(signature, str):
        try:
            signature = bytes.fromhex(signature)
        except ValueError:
            return False

    if not isinstance(signature, (bytes, bytearray)):
        return False

    try:
        event_bytes = canonicalize_event(event)
        public_key.verify(bytes(signature), event_bytes)
        return True
    except (InvalidSignature, TypeError, ValueError):
        return False
