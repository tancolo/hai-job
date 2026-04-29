# Hai Job Tracker

<div align="center">
  <p align="center">
    <b>English</b> | <a href="./README_CN.md">简体中文</a>
  </p>
</div>

Hai Job Tracker is an intelligent, privacy-first Chrome extension designed to help job seekers effortlessly capture, track, and manage their job applications directly from their browsers. 

With native support for automatic data extraction from popular job boards and a fully localized interface in 6 languages, Hai Job acts as your personal offline CRM for job hunting.

## 🌟 Key Features

- **One-Click Scraping**: Automatically extracts Company Name, City, Job Title, Work Type, and URL directly from popular job boards including LinkedIn, Indeed, and Jobbank.
- **Side Panel Interface**: Utilizes the modern Chrome Side Panel API, allowing you to fill in and save job applications without leaving the current tab.
- **Robust Dashboard**: A built-in management dashboard to view all saved applications, featuring global fuzzy search and multi-dimensional filtering (by Work Type, Interview Status, and Platform).
- **Inline Editing**: Quickly update interview progress (e.g. from "Applied" to "Interviewing") directly from the dashboard table.
- **Full CSV Data Flow**: 
  - **Export**: Backup all your data to a locally generated CSV file.
  - **Import**: Powerful CSV parsing engine that supports importing historical data from old Excel sheets with smart duplicate prevention.
- **Global i18n Support**: Seamlessly switch between English, Simplified Chinese, Traditional Chinese, Japanese, Korean, and French based on your browser's language settings.
- **Privacy-First**: 100% offline. All application data is stored locally in your browser's secure `chrome.storage.local`. No external servers, no tracking.

## 🚀 Installation (Load Unpacked)

Since this extension is in active development, you can install it locally using Chrome's Developer Mode.

1. Clone the repository and navigate to the `hai_job` directory.
2. Open Google Chrome and go to the extensions page: `chrome://extensions/`.
3. Toggle on **Developer mode** in the top right corner.
4. Click the **Load unpacked** button.
5. Select the `hai_job` directory.
6. The "Hai Job Tracker" extension will now be installed! Pin it to your toolbar for easy access.

## 📖 How to Use

1. **Scrape a Job**: Navigate to a job posting on LinkedIn, Indeed, or Jobbank.
2. **Open Panel**: Click the Hai Job extension icon to open the side panel. The extension will automatically extract the job details and populate the form.
3. **Review & Save**: Fill in any missing details (like Interview Status or custom Work Type) and click "Save".
4. **Dashboard**: Click "View All" or open the extension from a blank tab to access your dashboard. Here you can search, filter, inline-edit, or export/import your records.

## 🛠️ Tech Stack

- Vanilla JavaScript (ES6+)
- HTML5 & CSS3 (No external UI libraries)
- Chrome Extension Manifest V3
- Chrome Side Panel API & Storage API
