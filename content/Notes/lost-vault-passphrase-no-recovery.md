---
title: "A lost ClipVault passphrase can't be recovered"
description: "Why zero-knowledge architecture means a lost master passphrase cannot be reset."
pubDatetime: 2026-11-21
tags:
  - "clipvault"
  - "security"
  - "privacy"
draft: false
---

ClipVault secures your sensitive items using AES-256-GCM encryption with a key derived through PBKDF2 using 100,000 iterations and SHA-256. The master passphrase you choose is never stored on disk or transmitted over a network.

Because ClipVault has zero network permissions, no cloud backend, and no recovery backdoor, there is no mechanism to reset a forgotten passphrase. If you lose your master passphrase, all encrypted items inside the vault tab are permanently lost. Keep your master passphrase backed up securely.

Read the technical details in [How ClipVault encrypts your clips and vault](/posts/how-clipvault-encrypts-your-clips-and-vault/).
