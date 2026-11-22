---
title: "ScanXpert"
description: "Native Android PDF engine and document scanner built with Kotlin 2.0, Jetpack Compose, CameraX, and 16 KB page-size compliance."
type: "android-app"
status: "live"
links:
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.pdf.scanxpert"
featured: true
order: 2
pubDatetime: 2026-11-21
tags:
  - "android"
  - "pdf"
  - "scanner"
  - "kotlin"
  - "jetpack-compose"
draft: false
---

## Overview: The Native Advantage

ScanXpert is a high-performance, single-file native PDF application and document scanner built from the ground up for modern Android devices. Most third-party document apps rely on bloated C++ native binaries (such as MuPDF or PDFium) that add 20 to 40 MB to the APK size, risk memory corruption vulnerabilities, and frequently fail Google Play's 16 KB page-size requirement on Android 15.

I built ScanXpert around Android's built-in `PdfRenderer` graphics engine. By eliminating external `.so` binaries entirely, the app delivers near-instant startup times, silky-smooth native scrolling physics, guaranteed Android 15+ 16 KB page-size compliance, and an exceptionally small disk footprint.

## Tech Stack & Architecture

ScanXpert is engineered using contemporary Android patterns to maintain a responsive 60 FPS user interface during complex document manipulations:

- **Language**: Kotlin 2.0 with strict coroutine dispatching.
- **UI Framework**: 100% Jetpack Compose (Material 3) with dynamic color tokens.
- **Rendering Engine**: Native Android Graphics PDF (`android.graphics.pdf.PdfRenderer`).
- **Camera & Vision**: CameraX lifecycle framework with Google ML Kit edge detection.
- **Architecture**: MVI (Model-View-Intent) backed by the Repository pattern.
- **Minimum SDK**: Android 7.0+ (API level 24).

```
com.pdf.scanxpert.scan/
├── camera/
│   ├── CameraManager.kt       # CameraX configuration, flash, zoom, grid
│   ├── DocumentAnalyzer.kt    # ML Kit real-time edge detection pipeline
│   ├── ImageProcessor.kt      # 4-point perspective warp & pro filters
│   ├── ScannerScreen.kt       # Compose master viewfinder and controls
│   ├── ScanOverlay.kt         # Custom Canvas for animated locking brackets
│   └── components/            # Template chips, haptic triggers, thumbnails
└── viewmodel/
    └── ScannerViewModel.kt    # Auto-capture stability, batch queuing, PDF export
```

## PDF Reader Engine & Interaction

Viewing multi-hundred-page documents on mobile requires careful memory budgeting. ScanXpert avoids loading full documents into memory by utilizing an on-demand bitmap cache that dynamically renders visible pages at screen resolution:

- **Elite Navigation**: Jump directly to specific pages via a modal dialog or skim through documents with a fast-scrub slider that previews page indices without frame drops.
- **Smart Touch Gestures**: Double-tap transitions with animated zoom levels and hardware-accelerated two-finger pinch-to-zoom.
- **OLED Dark Mode**: A custom inversion filter that turns harsh white document backgrounds into deep black tones while preserving text legibility for night reading.
- **Display Modes**: Toggle seamlessly between vertical continuous scrolling and a horizontal page-flip layout.

## Advanced Camera Scanner Module

The document scanning pipeline matches professional hardware scanner quality directly on mobile without sending image data off the device:

### Real-Time ML Edge Detection
As you point the camera at a document, `DocumentAnalyzer.kt` inspects camera frames in real time. ML Kit isolates document boundaries against contrasting surfaces, drawing animated bracket overlays via `ScanOverlay.kt`.

### Hands-Free Auto-Capture
When the document remains stable inside the bounding brackets for 1.5 seconds, the camera automatically triggers capture with configurable haptic feedback. This eliminates tap-induced camera shake and speeds up multi-page digitizations.

### Perspective Correction & Processing
Raw captures undergo a 4-point perspective transform (`ImageProcessor.kt`) that flattens skewed angles into perfect rectangles. Users can select from three processing filters:
1. **Magic Color**: Removes harsh shadows, evens out lighting, and boosts contrast for crisp readability.
2. **High-Contrast B&W**: Strips color noise for clean monochrome text suited for legal filings and contracts.
3. **Original**: Retains raw photographic color fidelity.

### Batch Scanning & PDF Assembly
Capture multiple pages in sequence, reorder thumbnails on an interactive grid, and merge them directly into a compressed, standardized PDF document with a single tap.

## Categorized Control Center

ScanXpert exposes granular settings so power users can tune performance to their workflow:

| Category | Available Settings | Purpose |
| :--- | :--- | :--- |
| **Scanner Preferences** | Auto-capture toggle, default filter, haptic levels (Soft/Medium/Hard/Off), capture resolution | Control camera automation and capture sharpness |
| **PDF Reader** | Vertical continuous vs. horizontal magazine mode, Eye Comfort night mode, ink markup color | Customize reading comfort and annotation defaults |
| **Appearance & UX** | System default, Deep Dark (OLED), or Light mode; quick-scan home button toggle | Match system aesthetic and quick access |
| **Storage & Privacy** | Internal sandbox vs. external storage destination, one-tap cache flush | Manage local file paths and temporary artifacts |

## Next-Level Roadmap

ScanXpert is actively evolving with advanced on-device intelligence:

1. **Smart On-Device OCR**: Extract and copy text from scanned PDFs without network dependencies.
2. **AI Voice Reader (TTS)**: Listen to document chapters on the go with background speech synthesis.
3. **AI Smart Summarizer**: Generate concise 1-minute summaries of lengthy reports using local lightweight models.
4. **Specialized Scanning Modes**: Book curvature flattening to remove spine distortion, and passport-size photo arrangement layouts.

## Project Status & Distribution

ScanXpert is a proprietary native Android application currently in active development and internal testing. A public release targeting Android 15 and modern devices is planned for distribution once device verification concludes.
