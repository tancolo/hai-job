// Allow users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// When the extension is first installed
chrome.runtime.onInstalled.addListener(() => {
  console.log("Hai Job Tracker installed.");
});
