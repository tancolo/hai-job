document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('job-form');
  const workTypeSelect = document.getElementById('workType');
  const customWorkTypeInput = document.getElementById('customWorkType');
  const loadingOverlay = document.getElementById('loading-overlay');
  const btnViewAll = document.getElementById('btn-view-all');
  const toast = document.getElementById('toast');

  // Set today's date as default
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('date').value = today;

  // Handle Work Type Custom Option
  workTypeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
      customWorkTypeInput.classList.remove('hidden');
      customWorkTypeInput.required = true;
    } else {
      customWorkTypeInput.classList.add('hidden');
      customWorkTypeInput.required = false;
    }
  });

  // Request scraped data from content script
  async function scrapeCurrentPage() {
    loadingOverlay.classList.remove('hidden');
    
    // Safety timeout: forcefully hide spinner after 4 seconds
    const timeoutId = setTimeout(() => {
      loadingOverlay.classList.add('hidden');
      console.warn("Scraping timed out or page not supported.");
    }, 4000);

    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) {
        throw new Error('No active tab found or missing URL permissions.');
      }

      const urlObj = new URL(tab.url);
      const hostname = urlObj.hostname;

      let parserFile = null;
      let parserFuncName = null;

      if (hostname.includes('linkedin.com')) {
        parserFile = 'src/content/parsers/linkedin.js';
        parserFuncName = 'linkedin';
      } else if (hostname.includes('indeed.com')) {
        parserFile = 'src/content/parsers/indeed.js';
        parserFuncName = 'indeed';
      }

      if (parserFile) {
        // Inject the parser logic directly
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: [parserFile]
        });
      }

      // Execute a function in the page context to run the parser
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        args: [parserFuncName],
        func: (parserName) => {
           if (parserName && window.HaiJobParsers && window.HaiJobParsers[parserName]) {
             return window.HaiJobParsers[parserName]();
           }
           // Fallback if not a supported board
           return {
             company: '',
             location: '',
             title: '',
             url: window.location.href,
             platform: 'others'
           };
        }
      });

      clearTimeout(timeoutId);
      loadingOverlay.classList.add('hidden');

      if (results && results[0] && results[0].result) {
        populateForm(results[0].result);
      }
    } catch (err) {
      console.error("Scraping failed:", err);
      clearTimeout(timeoutId);
      loadingOverlay.classList.add('hidden');
    }
  }

  // Populate form with scraped data
  function populateForm(data) {
    if (data.company) document.getElementById('company').value = data.company;
    if (data.location) document.getElementById('location').value = data.location;
    if (data.title) document.getElementById('title').value = data.title;
    if (data.url) document.getElementById('url').value = data.url;
    
    if (data.workType) {
      const workTypeSelect = document.getElementById('workType');
      let found = false;
      for (let i = 0; i < workTypeSelect.options.length; i++) {
        if (workTypeSelect.options[i].value.toLowerCase() === data.workType.toLowerCase()) {
          workTypeSelect.value = workTypeSelect.options[i].value;
          found = true;
          break;
        }
      }
      if (!found) {
        workTypeSelect.value = 'custom';
        const customInput = document.getElementById('customWorkType');
        customInput.value = data.workType;
        customInput.classList.remove('hidden');
        customInput.required = true;
      }
    }

    if (data.platform) {
      const platformSelect = document.getElementById('platform');
      // Set value if it exists in options, else set to others
      let found = false;
      for (let i = 0; i < platformSelect.options.length; i++) {
        if (platformSelect.options[i].value.toLowerCase() === data.platform.toLowerCase()) {
          platformSelect.value = platformSelect.options[i].value;
          found = true;
          break;
        }
      }
      if (!found && data.platform !== '') {
        platformSelect.value = 'others';
      }
    }
  }

  // Handle Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form values
    const formData = new FormData(form);
    const jobData = Object.fromEntries(formData.entries());
    
    // Handle custom work type
    if (jobData.workType === 'custom') {
      jobData.workType = document.getElementById('customWorkType').value;
    }
    
    // Remove the customWorkType field from data to be saved
    delete jobData.customWorkType;

    try {
      await StorageUtil.saveJob(jobData);
      showToast();
      // Optional: Clear form after saving? For now we keep it so user can edit.
    } catch (err) {
      console.error('Failed to save job:', err);
      alert('保存失败: ' + err.message);
    }
  });

  // Handle View All Button
  btnViewAll.addEventListener('click', () => {
    // Open the dashboard page in a new tab
    chrome.tabs.create({ url: 'src/dashboard/dashboard.html' });
  });

  // Show success toast
  function showToast() {
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }

  // Initiate scraping when popup is opened
  scrapeCurrentPage();
});
