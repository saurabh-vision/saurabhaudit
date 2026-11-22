---
title: "How to Verify an Android App Has No Internet Access"
description: "Step-by-step guide to verifying that an Android application has zero network access using ADB commands, aapt inspection, and cryptographic APK checks."
pubDatetime: 2026-11-21
tags:
  - "clipvault"
  - "android"
  - "privacy"
draft: false
---

You should never blindly trust an application's marketing claims when it promises complete offline privacy. In the Android operating system, network communication is strictly governed by the presence of the `android.permission.INTERNET` declaration in the app's manifest. By using standard command-line tools like ADB, aapt, and apksigner, you can verify whether an Android package has any capability to open sockets or transmit data over the internet.

## Key takeaways

- If an Android application does not declare `android.permission.INTERNET` in its manifest, the operating system kernel will refuse all socket creation attempts.
- You can inspect installed packages using `adb shell dumpsys` or audit uninstalled APK packages using `aapt` and `aapt2` before installation.
- Verifying the APK's SHA-256 hash and signing certificate guarantees that your installed binary was built from the official release without third-party tampering.
- While static verification confirms the absence of network permissions and analytics SDKs, it cannot protect against system-level malware on a rooted device.

## The Operating System Permission Barrier

Android enforces security through user boundaries and sandboxed Linux processes. Network access is not granted by default; an application must explicitly declare the `android.permission.INTERNET` permission in its `AndroidManifest.xml` file at build time.

When this permission is absent, the Android zygote process spawns the application with a user group ID that lacks network socket creation privileges. Any attempt by application code or an embedded third-party SDK to initiate an HTTP connection or connect to an IP address fails immediately at the operating system kernel level.

When building [ClipVault](/products/clipvault/), I left `android.permission.INTERNET` out of the manifest on purpose to ensure that clipboard records and passwords could never leave the physical device.

<figure class="diagram">
  <img src="/diagrams/clipvault-verify-checklist.svg" alt="Diagram showing the 5 verification checks for ClipVault including internet permission, signing certificate, and debug flags." width="800" height="480" loading="lazy" decoding="async" />
  <figcaption>Figure 1: Verification checklist for auditing an offline Android package.</figcaption>
</figure>

## Method 1: In-App Verification Screen

Before diving into developer tools, you can perform an initial audit directly from within the application interface:

1. Open the app and navigate to **Settings > Tools > Verify it yourself**.
2. Review the displayed permission checklist to confirm that network access is absent.
3. Check the database inspection status, which reads the raw SQLCipher database file header to prove the database is encrypted ciphertext rather than plaintext SQLite.
4. Verify the displayed APK SHA-256 hash and signing certificate fingerprint against the published release notes on GitHub.
5. Review the built-in dependency audit confirming the absence of known telemetry and advertising SDKs.

## Method 2: Verifying an Installed Package via ADB

If you have enabled developer options on your Android device, you can query the system's package manager via the Android Debug Bridge (ADB).

Run the following command against an installed package:

```bash
adb shell dumpsys package com.clipvault.app | grep -i permission
```

Examine the output carefully:

- You should see optional declared permissions like `android.permission.USE_BIOMETRIC`, `android.permission.CAMERA`, and `android.permission.VIBRATE`.
- You will see WorkManager background execution declarations such as `WAKE_LOCK`, `RECEIVE_BOOT_COMPLETED`, and `FOREGROUND_SERVICE` used for local maintenance like trash retention purging.
- The `android.permission.INTERNET` string must **not** appear anywhere in the granted or requested permission list.

You may also observe `BIND_*` attributes attached to services, such as the input method or autofill services. These are not user permissions; rather, they are system-level protection barriers ensuring that only the Android operating system itself can bind to those components.

## Method 3: Inspecting the APK Before Installation

You can audit a standalone package file (such as `ClipVault-release.apk`) on your computer before copying it to your phone.

### Checking Declared Permissions with aapt

Use the Android Asset Packaging Tool (`aapt`) from the Android SDK build-tools to dump the package manifest:

```bash
aapt dump badging ClipVault-release.apk | grep -i permission
```

Verify that `uses-permission: name='android.permission.INTERNET'` is completely absent from the terminal output.

### Verifying Signing Certificate and Integrity

To confirm that the package was signed by the authentic developer key and has not been modified in transit, use `apksigner`:

```bash
apksigner verify --verbose ClipVault-release.apk
apksigner verify --print-certs ClipVault-release.apk
```

Compare the printed SHA-256 digest against the official release notes. Note that builds from different distribution channels (such as GitHub Releases versus the upcoming F-Droid release) use different signing keys and cannot be cross-updated.

### Auditing Debug and Cloud Backup Flags

A production security application must disable system debugging and remote cloud extraction:

```bash
aapt dump badging ClipVault-release.apk | grep -i debuggable
```

This command should return no output, confirming that `android:debuggable` is false. Next, inspect the cloud backup flag:

```bash
aapt2 dump xmltree ClipVault-release.apk --file AndroidManifest.xml | grep -i allowBackup
```

The output should confirm that `android:allowBackup="false"`, ensuring that automated Google Drive cloud backups cannot scrape your local database files.

## Method 4: Auditing Source Dependencies

If you are building the project from a source checkout, you can run the automated dependency scanner:

```bash
./gradlew checkNoTrackerDependencies
```

This build task checks all dependencies against a known list of analytics and tracking SDKs, ensuring that no reporting libraries are compiled into the final binary.

## Limits and Verification Boundaries

While these inspection steps provide robust verification, you must be aware of platform limitations:

- **Verification Scope**: These checks prove that the installed binary has no network capability and contains no telemetry SDKs. They cannot prevent operating system-level keylogging if the device itself is compromised.
- **Rooted Devices**: If a device is rooted, kernel-level processes or root-enabled apps can bypass normal sandbox boundaries to inspect process memory directly.
- **Manual Backups**: Because the application has no internet access, moving data to a new phone requires generating an encrypted backup file and copying it over USB or local storage.

## Summary

Verifying that an Android application has zero network access is straightforward using standard command-line tools. By confirming that `android.permission.INTERNET` is absent, validating the APK signature, and inspecting backup and debugging flags, you can independently verify that your data remains strictly on your device. For more details on local data security, read [how ClipVault encrypts your clips and vault](/posts/how-clipvault-encrypts-your-clips-and-vault) and [how ClipVault saves your clipboard on Android 10+](/posts/how-clipvault-saves-clipboard-on-android-10).
