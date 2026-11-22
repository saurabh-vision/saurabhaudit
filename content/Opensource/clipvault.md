---
title: "ClipVault"
description: "Open-source, fully offline clipboard manager and encrypted password vault for Android. No INTERNET permission, and you can verify that yourself."
type: "android-app"
status: "beta"
links:
  githubUrl: "https://github.com/saurabh-vision/clipvault"
featured: true
order: 1
pubDatetime: 2026-11-21
tags:
  - "clipvault"
  - "android"
  - "privacy"
  - "open-source"
draft: false
---

## What it does

ClipVault is an open-source, 100% offline clipboard manager and encrypted password vault for Android 8.0+. It solves the modern Android clipboard restriction by integrating an on-device keyboard that automatically captures, hashes, and categorizes copied text in real time.

Beyond clipboard history, ClipVault provides an encrypted vault for logins, TOTP codes, payment cards, secure notes, identities, and Wi-Fi credentials. It classifies sensitive patterns like UPI IDs, OTPs, and URLs with on-device regex, prompts before launching payments, and offers offline camera OCR and QR scanning without saving photos to disk.

## Privacy you can check

I deliberately omitted `android.permission.INTERNET` from `AndroidManifest.xml`. Because the permission is absent, the operating system blocks all socket creation, preventing network data leaks.

You can verify this in the app under **Settings > Tools > Verify it yourself** to inspect declared permissions, confirm the database file header is ciphertext, check the APK SHA-256 fingerprint, and verify the absence of tracking SDKs.

## Status and limits

ClipVault is at release candidate status (`v1.0.0-rc.1`). The internal security review is complete, and verification on physical OEM devices is in progress.

Because Android 10+ restricts background clipboard access, automatic capture requires the ClipVault Keyboard to be active. There is no cloud sync; moving data requires manual encrypted backups. Forgotten master passphrases cannot be recovered because there is no backdoor or recovery escrow.

## Get it

Download signed release APKs from [GitHub Releases](https://github.com/saurabh-vision/clipvault/releases). Verify the APK SHA-256 hash against the release notes before installing. An F-Droid release is in preparation.

ClipVault is licensed under **GPL-3.0** (forks and redistributions must be rebranded). Report security issues privately via [Security Advisories](https://github.com/saurabh-vision/clipvault/security/advisories).

## Read more

- [How ClipVault Saves Your Clipboard on Android 10+](/posts/how-clipvault-saves-clipboard-on-android-10)
- [How to Verify an Android App Has No Internet Access](/posts/verify-android-app-has-no-internet-permission)
- [How ClipVault Encrypts Your Clips and Vault](/posts/how-clipvault-encrypts-your-clips-and-vault)
