---
title: "How ClipVault Saves Your Clipboard on Android 10+"
description: "Learn how ClipVault captures clipboard history on Android 10+ using a dedicated input method, smart regex classification, and strict privacy pauses."
pubDatetime: 2026-11-21
tags:
  - "clipvault"
  - "android"
  - "clipboard"
draft: false
---

Android 10 introduced strict privacy protections that prevent background applications from reading your clipboard data. To monitor clipboard history without compromising platform security, an application must run as the active on-screen keyboard or receive text shared directly while in the foreground. I built ClipVault to provide seamless clipboard history and smart categorization by pairing an on-device input method with local regex classification and strict sensitive-field pauses.

## Key takeaways

- Starting in Android 10, background services cannot listen to clipboard changes; only the active input method (IME) or the focused foreground application can read clipboard data.
- ClipVault provides continuous capture by including an on-device English QWERTY keyboard with dedicated tabs for Clips, Templates, Vault records, and Text Tools.
- Alternative capture routes exist when using another keyboard: Android's Share sheet, the "Save to ClipVault" text-selection menu item, manual entry, or camera OCR.
- Capture automatically pauses in password fields and incognito browsers, and sensitive text like payment cards is masked at rest.

## The Android 10 Clipboard Security Boundary

Before Android 10, any application installed on your device could register an unrestricted clipboard listener. A rogue app running silently in the background could monitor every piece of text you copied, including authentication codes, personal addresses, and passwords copied from notes.

Google closed this vulnerability in Android 10 (API level 29) by enforcing a strict platform rule: only the application that currently holds user input focus or the active input method editor (IME) can inspect the contents of `ClipboardManager`. While this change dramatically improved system-wide privacy, it broke traditional standalone clipboard managers that relied on background polling services.

## Why ClipVault Uses an Input Method

To capture copied text reliably without requesting invasive accessibility privileges, I packaged ClipVault with a dedicated on-screen keyboard. Because the active keyboard is granted clipboard access by the Android framework, it captures copied text immediately.

<figure class="diagram">
  <img src="/diagrams/clipvault-capture-flow.svg" alt="Flowchart showing clipboard text capture through the active ClipVault keyboard or manual fallback routes." width="800" height="420" loading="lazy" decoding="async" />
  <figcaption>Figure 1: ClipVault clipboard capture flow depending on active keyboard state.</figcaption>
</figure>

The keyboard layout features a clean English QWERTY interface with four dedicated utility tabs:

- **Clips**: Browse, search, pin, or paste your recent clipboard history directly into any text field.
- **Templates**: Insert reusable text snippets containing dynamic variables like `{date}`, `{time}`, `{clipboard}`, or custom placeholders.
- **Vault**: Unlock your credentials and insert saved logins or TOTP two-factor codes without leaving your active app.
- **Text Tools**: Perform quick local text manipulations directly from the keyboard surface.

The keyboard never logs keystrokes, never stores typed passwords, and explicitly disables learning and word suggestions when you focus a password input field.

## Capturing Clips Without the Custom Keyboard

You might prefer using your manufacturer's default keyboard or another third-party input method. When the ClipVault Keyboard is not active, automatic background clipboard capture cannot run due to the Android 10 restriction. 

In this scenario, you can still save text into [ClipVault](/products/clipvault/) through four manual methods:

1. **Android Share Sheet**: Highlight text in any application, tap **Share**, and select **ClipVault**.
2. **Text-Selection Context Menu**: Select text and choose the custom **Save to ClipVault** action from the floating text toolbar.
3. **Manual Entry**: Open ClipVault directly and tap the add button to paste or type notes manually.
4. **Camera OCR Scanner**: Use the integrated on-device camera scanner powered by Tesseract4Android to extract text from physical paper without saving photos to disk.

## Privacy Pauses and Exclusion Rules

A clipboard manager should never blindly record sensitive authentication data. I designed ClipVault with automated guardrails to prevent accidental retention of private material:

- **Incognito & Password Pauses**: Capture automatically suspends whenever an input field is flagged as a password or when working inside private browser windows.
- **Sensitive App Exclusions**: You can configure an exclusion list to block capture inside banking applications or third-party password managers.
- **Masked Storage**: Payment card numbers and identity digits are automatically masked when detected, shielding them from over-the-shoulder viewing.
- **OTP Auto-Expiry**: Temporary one-time passwords can be set to automatically purge from your history after a configurable window between 5 and 60 minutes.

## On-Device Classification and Smart Actions

Once copied text is received, ClipVault computes a content hash for instant deduplication with copy counters. Instead of sending text to a cloud server, the app executes on-device regular expressions to classify specific data types:

- **Financial Identifiers**: Recognizes UPI IDs and IFSC codes, offering a one-tap action to launch payments with an explicit confirmation dialog.
- **Security & Communication**: Flags OTP codes, telephone numbers, and email addresses for single-tap dialing, composing, or copying.
- **Web Links**: Detects URLs, strips tracking query parameters, and presents look-alike character warnings to guard against homograph phishing attempts.

For organization, you can assign clips to custom folders using 18 color presets, favorite frequent items, or perform full-text searches across both Latin text and Devanagari Hindi using an offline SQLite FTS4 index.

## Limits and What Is Not Covered

While ClipVault provides comprehensive clipboard management, several platform constraints must be understood:

- **Keyboard-Dependent Capture**: If you do not have the ClipVault Keyboard selected as your active input method, automatic background capture will not occur.
- **No Source App Identity**: Android does not disclose which application initiated a copy action to the receiving clipboard listener. ClipVault attributes clips based on the current foreground context where available, but this is an approximation.
- **Home Screen Widgets**: Pinned clips displayed on home screen widgets can be viewed by anyone who can see your unlocked launcher, as widgets do not prompt for biometric authentication.
- **Trash Retention**: Deleted clips move to a local trash folder with retention between 30 and 90 days before permanent deletion.

## Summary

Android 10's security boundary prevents hidden background clipboard logging, but integrating a dedicated on-screen keyboard allows ClipVault to capture, deduplicate, and classify your copied text completely offline. To learn more about how data is safeguarded on disk, see [how ClipVault encrypts your clips and vault](/posts/how-clipvault-encrypts-your-clips-and-vault), or [verify that ClipVault has no internet permission](/posts/verify-android-app-has-no-internet-permission) on your own device.
