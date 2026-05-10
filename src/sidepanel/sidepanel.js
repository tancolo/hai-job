document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('job-form');
  const workTypeSelect = document.getElementById('workType');
  const customWorkTypeInput = document.getElementById('customWorkType');
  const loadingOverlay = document.getElementById('loading-overlay');
  const btnViewAll = document.getElementById('btn-view-all');
  const btnSave = document.getElementById('btn-save');
  const toast = document.getElementById('toast');
  const unsupportedBanner = document.getElementById('unsupported-banner');
  const unsupportedMsg = document.getElementById('unsupported-msg');
  const unsupportedClose = document.getElementById('unsupported-close');
  const btnAutofill = document.getElementById('btn-autofill');
  const autofillSection = document.getElementById('autofill-section');
  let loadingTimeout;

  // Supported job site hostnames (must match manifest.json host_permissions)
  const SUPPORTED_HOSTS = [
    'linkedin.com',
    'indeed.com',
    'jobbank.gc.ca',
    'greenhouse.io'
  ];

  function isSupportedSite(hostname) {
    return SUPPORTED_HOSTS.some(host => hostname.includes(host));
  }

  function showUnsupportedBanner() {
    const fullMsg = chrome.i18n.getMessage('unsupportedSiteMsg') || '';
    // Strip the email from the message text (rendered as a separate clickable link)
    const msgText = fullMsg.replace(/support@getridepilot\.com/g, '').replace(/[:：]\s*$/, '.').trim();
    // Bold the three supported platform names wherever they appear
    const boldedMsg = msgText
      .replace(/LinkedIn/g, '<strong>LinkedIn</strong>')
      .replace(/Indeed/g, '<strong>Indeed</strong>')
      .replace(/Job Bank/g, '<strong>Job Bank</strong>')
      .replace(/Greenhouse/gi, '<strong>Greenhouse</strong>');
    unsupportedMsg.innerHTML = boldedMsg;
    unsupportedBanner.classList.remove('hidden');
  }

  // Close button dismisses the banner for this session
  unsupportedClose.addEventListener('click', () => {
    unsupportedBanner.classList.add('hidden');
  });

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
    chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
      if (tabs[0]) {
        loadingOverlay.classList.remove('hidden');
        btnSave.disabled = true;
        btnSave.textContent = chrome.i18n.getMessage("msgAnalyzing") || '处理中...';

        loadingTimeout = setTimeout(() => {
          hideLoading();
          console.warn("Scraping timed out or page not supported.");
        }, 4000);

        try {
          const tab = tabs[0];
          const tabUrl = tab.url || '';

          // Step 1: Only http/https pages can be scraped.
          // chrome://, about:, file:// etc. are not job sites.
          if (!tabUrl.startsWith('http://') && !tabUrl.startsWith('https://')) {
            hideLoading();
            showUnsupportedBanner();
            return;
          }

          const urlObj = new URL(tabUrl);
          const hostname = urlObj.hostname;

          let parserFile = null;
          let parserFuncName = null;

          if (hostname.includes('linkedin.com')) {
            parserFile = 'src/content/parsers/linkedin.js';
            parserFuncName = 'linkedin';
          } else if (hostname.includes('indeed.com')) {
            parserFile = 'src/content/parsers/indeed.js';
            parserFuncName = 'indeed';
          } else if (hostname.includes('jobbank.gc.ca')) {
            parserFile = 'src/content/parsers/jobbank.js';
            parserFuncName = 'jobbank';
          } else if (hostname.includes('greenhouse.io')) {
            parserFile = 'src/content/parsers/greenhouse.js';
            parserFuncName = 'greenhouse';
            autofillSection.classList.remove('hidden');
          }

          if (parserFile) {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: [parserFile]
            });
          } else {
            // Recognized http site but no parser available — show unsupported banner
            hideLoading();
            showUnsupportedBanner();
            return;
          }

          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            args: [parserFuncName],
            func: (parserName) => {
               if (parserName && window.HaiJobParsers && window.HaiJobParsers[parserName]) {
                 return window.HaiJobParsers[parserName]();
               }
               return {
                 company: '',
                 location: '',
                 title: '',
                 url: window.location.href,
                 platform: 'others'
               };
            }
          });

          hideLoading();
          if (results && results[0] && results[0].result) {
            populateForm(results[0].result);
          }
        } catch (err) {
          console.error("Scraping failed:", err);
          hideLoading();
        }
      }
    });
  }

  function hideLoading() {
    if (!loadingOverlay.classList.contains('hidden')) {
      loadingOverlay.classList.add('hidden');
      btnSave.disabled = false;
      btnSave.textContent = chrome.i18n.getMessage("btnSave") || '保存投递';
      if (loadingTimeout) clearTimeout(loadingTimeout);
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

  // Open Dashboard — reuse existing tab if already open, otherwise create a new one.
  // Uses background.js to track the dashboard tab ID — avoids needing "tabs" permission.
  function openDashboard() {
    const dashboardUrl = chrome.runtime.getURL('src/dashboard/dashboard.html');
    chrome.runtime.sendMessage({ action: 'get_dashboard_tab' }, (resp) => {
      const tabId = resp && resp.tabId;
      if (tabId) {
        // Try to focus the existing tab; if it fails (tab was closed), open a new one
        chrome.tabs.update(tabId, { active: true }, (tab) => {
          if (chrome.runtime.lastError || !tab) {
            chrome.tabs.create({ url: dashboardUrl });
          } else {
            chrome.windows.update(tab.windowId, { focused: true });
          }
        });
      } else {
        chrome.tabs.create({ url: dashboardUrl });
      }
    });
  }

  // Handle Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const jobData = Object.fromEntries(formData.entries());
    
    if (jobData.workType === 'custom') {
      jobData.workType = document.getElementById('customWorkType').value;
    }
    delete jobData.customWorkType;

    try {
      const allJobs = await StorageUtil.getJobs();
      const isDuplicate = allJobs.some(existingJob => 
        (existingJob.company || '').trim().toLowerCase() === (jobData.company || '').trim().toLowerCase() && 
        (existingJob.title || '').trim().toLowerCase() === (jobData.title || '').trim().toLowerCase() &&
        (existingJob.location || '').trim().toLowerCase() === (jobData.location || '').trim().toLowerCase()
      );

      if (isDuplicate) {
        alert(chrome.i18n.getMessage("msgDuplicateJob"));
        return;
      }

      await StorageUtil.saveJob(jobData);
      showToast(chrome.i18n.getMessage("msgSaveSuccess") || '保存成功！');
      setTimeout(() => {
        openDashboard();
        window.close();
      }, 1500);
    } catch (err) {
      console.error('Save error:', err);
      alert((chrome.i18n.getMessage("msgSaveFailed") || '保存失败: ') + err.message);
    }
  });

  // Handle View All Button
  btnViewAll.addEventListener('click', () => {
    openDashboard();
    window.close();
  });

  // Handle Autofill Button
  btnAutofill.addEventListener('click', async () => {
    chrome.storage.local.get(['userProfile'], async (result) => {
      const p = result.userProfile;
      if (!p || (!p.firstName && !p.lastName && !p.email)) {
        alert(chrome.i18n.getMessage("msgProfileEmpty") || "Please configure your Profile in Dashboard first!");
        openDashboard();
        return;
      }
      
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          chrome.tabs.sendMessage(tab.id, { action: 'autofill_greenhouse', profile: p }, (response) => {
            showToast(chrome.i18n.getMessage("msgAutofillSuccess") || "Form autofilled!");
          });
        }
      } catch (err) {
        console.error("Autofill failed", err);
      }
    });
  });

  // Show success toast
  function showToast(msg) {
    if (msg) toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }

  // Initiate scraping when popup is opened
  scrapeCurrentPage();
});
