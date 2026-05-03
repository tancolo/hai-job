// Allow users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// When the extension is first installed
chrome.runtime.onInstalled.addListener(() => {
  console.log("Hai Job Tracker installed.");
});

// ── Dashboard Tab Tracking ───────────────────────────────────────────────────
// Track the dashboard tab ID so sidepanel can reuse it instead of opening a new tab.
// This avoids needing the "tabs" permission (which shows "Read browsing history" warning).
let dashboardTabId = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'register_dashboard') {
    // Dashboard page reports its own tab ID on load
    dashboardTabId = msg.tabId;
    sendResponse({ ok: true });
  } else if (msg.action === 'get_dashboard_tab') {
    // Sidepanel asks: is there an open dashboard tab?
    sendResponse({ tabId: dashboardTabId });
  }
  return true; // keep message channel open for async sendResponse
});

// Clear stored tab ID when the dashboard tab is closed
// Note: chrome.tabs.onRemoved does NOT require the "tabs" permission
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === dashboardTabId) {
    dashboardTabId = null;
  }
});
