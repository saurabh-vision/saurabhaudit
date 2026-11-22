---
title: "How ClipVault Encrypts Your Clips and Vault"
description: "An in-depth guide to ClipVault's encryption architecture: Room with SQLCipher 4.6.1, PBKDF2-HMAC-SHA256, AES-256-GCM, and Android Keystore."
pubDatetime: 2026-11-21
tags:
  - "clipvault"
  - "encryption"
  - "privacy"
draft: false
---

Storing sensitive clipboard history alongside a password vault on a mobile device demands a layered cryptographic architecture. While clipboard items must remain accessible to the on-screen keyboard as you type, high-value vault secrets like master logins and payment cards must stay locked behind an authenticated master key. I built ClipVault with a two-tier encryption hierarchy: an always-encrypted SQLCipher database for clipboard history and an individually authenticated AES-256-GCM envelope for vault secrets.

## Key takeaways

- Clipboard clips are stored in a Room SQLite database encrypted at rest with SQLCipher 4.6.1 using 256-bit AES-CBC.
- Vault items are encrypted individually with AES-256-GCM under a Vault Master Key (VMK) derived using PBKDF2-HMAC-SHA256 with 600,000 iterations.
- Biometric authentication operates strictly as a local convenience shortcut to unwrap the VMK from Android Keystore; it does not replace the master passphrase.
- All passphrase buffers are held in `CharArray` structures and zeroized in memory immediately upon locking.

## The Two-Tier Storage Architecture

A password vault and a clipboard manager have fundamentally different availability requirements. If a clipboard database locked completely whenever the screen turned off, an on-screen keyboard would be unable to store new clips when copying text. Conversely, storing passwords in an unlocked SQLite table exposes credentials to memory-scraping attacks.

To resolve this conflict, I separated storage into two distinct cryptographic tiers:

<figure class="diagram">
  <img src="/diagrams/clipvault-key-hierarchy.svg" alt="Diagram showing two key derivation chains: PBKDF2 to AES-256-GCM for vault items and SecureRandom to SQLCipher for clips." width="800" height="520" loading="lazy" decoding="async" />
  <figcaption>Figure 1: ClipVault two-tier key derivation and database encryption hierarchy.</figcaption>
</figure>

### Tier 1: Encrypted Clips Database at Rest

Clipboard history is stored in a local Room SQLite database managed by SQLCipher 4.6.1. SQLCipher encrypts every page of the database file on disk using 256-bit AES-CBC.

Rather than prompting you for a database password on every copy, the database encryption key is generated at initial setup using `SecureRandom`. This 256-bit raw hex key is wrapped and protected inside the hardware-backed Android Keystore. When the application initializes, the key is unwrapped and supplied directly to SQLCipher, bypassing SQLCipher's internal key derivation function (KDF) to ensure rapid database opens.

### Tier 2: Authenticated Vault Item Encryption

The vault tier stores high-risk credentials, including website logins, TOTP two-factor secrets, payment cards, secure notes, identities, and Wi-Fi configurations.

Every vault record is encrypted individually using AES-256-GCM with a 12-byte random initialization vector (IV) and a 128-bit authentication tag. This authenticated encryption mode ensures that ciphertext cannot be modified or tampered with without immediate detection.

All vault records are encrypted under a single Vault Master Key (VMK). The VMK itself is encrypted at rest using a Key Encryption Key (KEK) derived from your master passphrase using PBKDF2-HMAC-SHA256 configured with:

- **600,000 iterations**: Resists brute-force cracking on modern GPU hardware.
- **16-byte random salt**: Generated uniquely per vault installation.

## Biometrics as a Convenience Shortcut

ClipVault supports optional Class 3 biometric unlocking via fingerprint or face recognition. However, biometrics do not replace your master passphrase.

When you enable biometric unlock, the application wraps a copy of the VMK and stores it inside the Android Keystore with biometric authorization constraints. When you scan your fingerprint, Android Keystore unwraps the VMK directly into memory. 

You must still retain your master passphrase: it is strictly required to decrypt manual backup files, restore data to a new device, and access core recovery settings.

## Memory Hygiene and Screen Protections

Cryptographic safety is meaningless if keys or plaintext passwords remain exposed in memory or leak through operating system interfaces:

- **Zeroized Memory Buffers**: Master passphrases and decryption keys are handled as `CharArray` and byte arrays rather than immutable Java strings. When the vault locks, these arrays are explicitly overwritten with zeroes.
- **Window Protection with FLAG_SECURE**: All vault screens enable Android's `FLAG_SECURE` window attribute. This blocks screenshots, screen recording, and prevents the Android system from capturing window thumbnails in the recent apps switcher.
- **Auto-Lock Timers**: You can configure vault auto-locking to engage immediately, after 1 minute, after 5 minutes, or automatically when the device screen turns off.
- **Clipboard Auto-Wipe**: When you copy a password or sensitive record, ClipVault can automatically clear the system clipboard after a configurable delay between 10 and 120 seconds.

## Built-In Vault Utilities and Migration

The vault includes several offline productivity tools designed to operate without remote server calls:

- **Offline Password and Passphrase Generator**: Generate random passwords or readable EFF wordlist passphrases completely offline.
- **Offline Health Check**: Audits your database locally to flag weak, duplicate, or reused passwords, and identifies accounts missing two-factor authentication without sending hashes to external APIs.
- **Integrated TOTP Generator**: Generates RFC 6238 and RFC 4226 two-factor authentication codes with an animated 30-second countdown timer.
- **Migration & Imports**: Import existing credential exports from Bitwarden (JSON or CSV), Google Chrome and Mozilla Firefox (CSV), KeePass (XML or CSV), and Google Authenticator (`otpauth-migration://` QR exports). Encrypted `.kdbx` files cannot be parsed directly; you must export to unencrypted CSV or JSON in a secure offline environment first.
- **Encrypted Backup Envelope**: Export complete vault and clipboard archives wrapped in an atomic, AES-256-GCM encrypted envelope for local USB transfer.

## What Is Not Protected

Honest security engineering requires clearly defining what an application cannot protect against:

- **Rooted Devices**: If a device is rooted, kernel-level processes or debuggers can inspect process memory and scrape encryption keys from RAM while the vault is unlocked.
- **Open Clips Connection**: Because the on-screen keyboard must record clips in the background, the SQLCipher database connection remains open while the vault is locked. Only the VMK-encrypted vault records and sensitive memory holders lock.
- **Device Malware under the Same UID**: Any malicious payload operating under the app's own user identity while the vault is unlocked could read decrypted memory.
- **Permanent Data Loss on Forgotten Passphrase**: There is no password recovery, cloud escrow, or administrative backdoor. If you lose your master passphrase, your vault data is permanently unrecoverable.
- **Review Notice**: The security design was reviewed internally; it is not an external independent audit, and no absolute security guarantee is made. Bit-for-bit reproducible builds remain an aspirational goal.

## Summary

ClipVault balances daily convenience with strong cryptographic hygiene by pairing an always-available, encrypted SQLCipher database for clipboard history with an authenticated AES-256-GCM vault layer derived from 600,000 PBKDF2 iterations. To explore the app and its verified permissions, visit the [ClipVault product page](/products/clipvault/), check [how ClipVault saves your clipboard on Android 10+](/posts/how-clipvault-saves-clipboard-on-android-10), or follow our guide on [how to verify an Android app has no internet access](/posts/verify-android-app-has-no-internet-permission).
