# Changelog

All notable changes to the **Hai Job Tracker** extension will be documented in this file.

## [1.1.0] - Greenhouse Integration & Autofill Support

This major update introduces support for the Greenhouse platform and a new autofill feature to streamline your job applications.

### ✨ Key Features

- **Greenhouse Integration**: Automated job data extraction for Greenhouse-powered career pages.
- **Autofill Functionality**: Quickly fill in application forms on Greenhouse using your saved user profile.
- **User Profile Management**: New dashboard section to configure your personal info (name, email, etc.) for autofill.
- **Improved i18n**: Full support for all 6 languages in the new Greenhouse and profile features.

### 🛠️ Improvements & Fixes

- Added `N/A` option to work type filters in Dashboard.
- Unified "Others" category across all supported languages.
- Optimized parser loading mechanism in content scripts.

## [1.0.0] - Initial Public Release

A privacy-first Chrome extension for job seekers to effortlessly capture, track, and manage job applications directly from your browser.

### ✨ Key Features

- **Multi-Platform Scraper**: Automated data extraction for **LinkedIn**, **Indeed**, and **Job Bank (GC)**.
- **Smart Dashboard**: Centralized management with fuzzy search and multi-criteria filtering (Work Type, Status, Platform).
- **CSV Data Hub**: Robust local export and import engine with smart duplicate detection and Excel-friendly encoding.
- **Privacy-First Architecture**: 100% offline storage (`chrome.storage.local`). No external servers, no tracking.
- **Global i18n Support**: Native support for 6 languages: English, Simplified Chinese, Traditional Chinese, Japanese, Korean, and French.
- **UX Enhancements**:
  - Automatic tab reuse for the Dashboard to minimize clutter.
  - "Unsupported Site" smart banner for non-integrated platforms.
  - Inline interview status updates with automatic date tracking.
  - Chrome Side Panel integration for seamless multitasking.

### 📦 Installation

- **Option A (Manual)**: Download `hai_job_v1.0.0.zip` from this release, unzip it, and load it via `chrome://extensions/` with Developer Mode enabled.
- **Option B (Official Store)**: Install directly from the [Chrome Web Store](https://chromewebstore.google.com/detail/hai-job-job-tracker/ahidkiepeifmcimdoiofliojopdaggbd).
