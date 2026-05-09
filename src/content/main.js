/**
 * Main content script orchestrator.
 * It listens for messages from the Side Panel and routes the scraping request
 * to the appropriate parser based on the current hostname.
 */

// Simple dynamic script loader to load the correct parser
function loadParser(hostname) {
  return new Promise((resolve) => {
    let scriptName = null;
    if (hostname.includes('linkedin.com')) {
      scriptName = 'linkedin.js';
    } else if (hostname.includes('indeed.com')) {
      scriptName = 'indeed.js';
    } else if (hostname.includes('jobbank.gc.ca')) {
      scriptName = 'jobbank.js';
    } else if (hostname.includes('greenhouse.io')) {
      scriptName = 'greenhouse.js';
    }

    if (!scriptName) {
      return resolve(null); // Not a supported board
    }

    // Check if already loaded
    if (window.HaiJobParsers && window.HaiJobParsers[scriptName.replace('.js', '')]) {
      return resolve(window.HaiJobParsers[scriptName.replace('.js', '')]);
    }

    const scriptUrl = chrome.runtime.getURL(`src/content/parsers/${scriptName}`);
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.onload = () => {
      resolve(window.HaiJobParsers[scriptName.replace('.js', '')]);
      script.remove(); // Clean up
    };
    script.onerror = () => {
      console.error(`Failed to load parser: ${scriptName}`);
      resolve(null);
    };
    (document.head || document.documentElement).appendChild(script);
  });
}

// The listener for messages from the extension (Popup/SidePanel)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SCRAPE_JOB_DETAILS") {
    const hostname = window.location.hostname;
    
    // Attempt to load the appropriate parser
    loadParser(hostname).then(parserFn => {
      if (parserFn) {
        const data = parserFn();
        sendResponse({ success: true, data: data });
      } else {
        // Fallback or unsupported site
        sendResponse({ 
          success: true, 
          data: { 
            url: window.location.href,
            platform: 'others'
          } 
        });
      }
    });

    return true; // Indicates that we will send response asynchronously
  }
});
