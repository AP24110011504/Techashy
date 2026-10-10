# Evidence Engine (AEGISX Sentinel)

Welcome to the **Evidence Engine**! This module is built for **Person 2: Evidence Trust & Cryptography**.

## Purpose

The `evidence_engine` module ensures that collected evidence cannot be silently modified, forged, or replaced. It establishes proof of authenticity and an unbroken chain of custody.

---

## Core Responsibilities

1. **Evidence Integrity (SHA-256)**
   - Computes a cryptographic checksum (fingerprint) for every piece of evidence.
   - If even a single byte of evidence changes, the SHA-256 hash changes completely, immediately exposing any tampering.

2. **Digital Signatures (Ed25519)**
   - Uses public-key cryptography (Ed25519) to sign evidence records.
   - Proves origin and authenticity: anyone can verify that the evidence was signed by an authorized Sentinel agent and has not been altered since.

3. **Tamper-Evident Hash Chain**
   - Chains evidence records together sequentially, where each new entry includes the cryptographic hash of the previous entry.
   - Makes deletion, reordering, or alteration of historical logs mathematically impossible to hide.
