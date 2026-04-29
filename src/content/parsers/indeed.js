// Indeed Job Parser
if (!window.HaiJobParsers) {
  window.HaiJobParsers = {};
}

window.HaiJobParsers.indeed = function() {
  const data = {
    company: '',
    location: '',
    title: '',
    url: window.location.href,
    platform: 'Indeed',
    workType: ''
  };

  try {
    // 1. Job Title
    const titleEl = document.querySelector('.jobsearch-JobInfoHeader-title') || 
                    document.querySelector('h1.jobsearch-JobInfoHeader-title') ||
                    document.querySelector('h2.jobsearch-JobInfoHeader-title');
    
    if (titleEl) {
      // Indeed sometimes adds "- job post" to the title string
      let rawTitle = titleEl.innerText || '';
      data.title = rawTitle.replace(/- job post/i, '').trim();
    } else {
      const fallbackH1 = document.querySelector('h1');
      if (fallbackH1) {
        data.title = fallbackH1.innerText.replace(/- job post/i, '').trim();
      }
    }

    // 2. Company Name
    const companyEl = document.querySelector('[data-testid="inlineHeader-companyName"]') || 
                      document.querySelector('.jobsearch-InlineCompanyRating a') ||
                      document.querySelector('.css-1h4l2d7');
    if (companyEl) {
      data.company = companyEl.innerText.trim();
    }

    // 3. Location
    const locationEl = document.querySelector('[data-testid="inlineHeader-companyLocation"]') || 
                       document.querySelector('.jobsearch-JobInfoHeader-subtitle > div:nth-child(2)') ||
                       document.querySelector('.css-1ik0zjr');
    if (locationEl) {
      data.location = locationEl.innerText.trim();
    }

    // 4. Work Type Extraction
    const headerContainer = document.querySelector('.jobsearch-JobComponent') || document.body;
    if (headerContainer) {
      const headerText = headerContainer.innerText.toLowerCase();
      // Look for explicit tags or keywords near the top
      if (headerText.includes('remote')) {
        data.workType = 'Remote';
      } else if (headerText.includes('hybrid')) {
        data.workType = 'Hybrid';
      } else if (headerText.includes('onsite') || headerText.includes('on-site') || headerText.includes('in-office') || headerText.includes('inoffice')) {
        data.workType = 'On-site';
      }
    }
  } catch (err) {
    console.error("Error parsing Indeed job:", err);
  }

  return data;
};
