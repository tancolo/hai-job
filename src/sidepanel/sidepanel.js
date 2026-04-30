document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('job-form');
  const workTypeSelect = document.getElementById('workType');
  const customWorkTypeInput = document.getElementById('customWorkType');
  const loadingOverlay = document.getElementById('loading-overlay');
  const btnViewAll = document.getElementById('btn-view-all');
  const btnSave = document.getElementById('btn-save');
  const toast = document.getElementById('toast');
  let loadingTimeout;

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
          } else if (hostname.includes('jobbank.gc.ca')) {
            parserFile = 'src/content/parsers/jobbank.js';
            parserFuncName = 'jobbank';
          }

          if (parserFile) {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: [parserFile]
            });
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
        chrome.tabs.create({ url: 'src/dashboard/dashboard.html' });
        window.close();
      }, 1500);
    } catch (err) {
      console.error('Save error:', err);
      alert((chrome.i18n.getMessage("msgSaveFailed") || '保存失败: ') + err.message);
    }
  });

  // Handle View All Button
  btnViewAll.addEventListener('click', () => {
    chrome.tabs.create({ url: 'src/dashboard/dashboard.html' });
    window.close();
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
