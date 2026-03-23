# 01 — Security & Data Architecture

> **LinkedBridge** — Docs as Code · Security Series

---

## 1. Threat Model: Why Isolate `OAuthCredential`?

### The Problem

Storing the user's encrypted LinkedIn `access_token` in the same table as their profile data (email, name) creates an unnecessarily large **blast radius**. If an attacker gains read access to the `users` table — via SQL injection, a leaked backup, or a misconfigured RLS policy — they obtain both the identity data and the encrypted tokens in a single query.

### The Solution: Table-Level Isolation

We store credentials in a dedicated `oauth_credentials` table:

```
┌─────────────────────┐       1:1       ┌───────────────────────────┐
│       users         │───────────────▶│   oauth_credentials       │
│─────────────────────│                 │───────────────────────────│
│ id (UUID PK)        │                 │ id (UUID PK)              │
│ email               │                 │ user_id (FK → users.id)   │
│ name                │                 │ provider_name             │
│ created_at          │                 │ encrypted_access_token    │
│ updated_at          │                 │ iv                        │
└─────────────────────┘                 │ auth_tag                  │
                                        │ refresh_token             │
                                        │ expires_at                │
                                        └───────────────────────────┘
```

**Benefits:**

| Benefit | Description |
|---|---|
| **Reduced Blast Radius** | A breach of `users` does not expose encrypted tokens. |
| **Granular Access Control** | DB-level RLS or app-level policies can restrict who/what reads `oauth_credentials`. |
| **Audit Trail** | Separate table enables independent audit logging for credential access. |
| **Rotation Independence** | Token rotation touches only `oauth_credentials`, no locking contention on `users`. |

---

## 2. AES-256-GCM: Why `iv` and `authTag`?

AES-256-GCM is an **authenticated encryption** algorithm. It provides both **confidentiality** (encryption) and **integrity** (tamper detection).

To decrypt a ciphertext, you need three things:

1. **Ciphertext** (`encrypted_access_token`) — the encrypted data.
2. **Initialization Vector** (`iv`) — a unique 12-byte random value per encryption operation. Reusing an IV with the same key **completely breaks GCM security**.
3. **Authentication Tag** (`auth_tag`) — a 16-byte tag that proves the ciphertext was not tampered with. If verification fails, decryption is rejected.

```
Encrypt(key, iv, plaintext) → (ciphertext, authTag)
Decrypt(key, iv, ciphertext, authTag) → plaintext | ERROR
```

> ⚠️ The `ENCRYPTION_KEY` is stored **only** in environment variables, never in the database. It is a 32-byte (256-bit) hex-encoded secret.

---

## 3. Portfolio API Key Verification Flow

API keys protect the public-facing endpoint that portfolio sites consume. The flow follows a **hash-then-compare** pattern:

### Key Generation (one-time)

```
1. Generate 32 random bytes → rawKey
2. Encode rawKey as URL-safe Base64 → displayKey
3. Compute SHA-256(rawKey) → hashedKey
4. Extract first 8 chars of displayKey → keyHint (e.g., "lnkb_a3f...")
5. Store { hashedKey, keyHint } in portfolio_api_keys
6. Return displayKey to user (shown ONCE, never stored)
```

### Key Verification (every request)

```
1. Extract X-API-KEY header from request
2. Decode Base64 → rawKey
3. Compute SHA-256(rawKey) → candidateHash
4. Query: SELECT * FROM portfolio_api_keys WHERE hashed_key = candidateHash
5. If not found OR revokedAt IS NOT NULL → 401 Unauthorized
6. If found and active → attach userId to request context
```

### Security Properties

- **Plaintext never stored** — even a full DB dump reveals only hashes.
- **Constant-time comparison** — use `crypto.timingSafeEqual` to prevent timing attacks.
- **Revocation** — setting `revoked_at` instantly invalidates a key without deletion (audit trail preserved).
- **Key hint** — allows users to identify which key is which in the dashboard without revealing the full key.

---

## 4. Future Considerations

- **Key Rotation Schedule**: Encrypt tokens with a versioned key (v1, v2). When rotating, re-encrypt all tokens with the new key and deprecate the old one.
- **Rate Limiting**: API key endpoints will be rate-limited per key to prevent abuse.
- **Supabase RLS**: If using Supabase managed PostgreSQL, configure Row Level Security on `oauth_credentials` to restrict access to the service role only.
