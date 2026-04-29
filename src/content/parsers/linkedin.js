/**
 * Parses LinkedIn job postings.
 */
// Attach to window object so it can be called by executeScript
if (!window.HaiJobParsers) {
  window.HaiJobParsers = {};
}

window.HaiJobParsers.linkedin = function() {
  const data = {
    company: '',
    location: '',
    title: '',
    url: window.location.href,
    platform: 'Linkedin',
    workType: ''
  };

  try {
    const titleElement = document.querySelector('h1.t-24.t-bold') || 
                         document.querySelector('.job-details-jobs-unified-top-card__job-title h1') || 
                         document.querySelector('.jobs-unified-top-card__job-title');
    if (titleElement) data.title = titleElement.innerText.trim();

    const companyElement = document.querySelector('.job-details-jobs-unified-top-card__company-name a') ||
                           document.querySelector('.jobs-unified-top-card__company-name a') ||
                           document.querySelector('.job-details-jobs-unified-top-card__company-name') ||
                           document.querySelector('.jobs-unified-top-card__company-name');
    if (companyElement) data.company = companyElement.innerText.trim();

    // 3. Location Extraction
    // Method A: Exact span class provided from Chrome Inspect
    const locationSpans = document.querySelectorAll('span.tvm__text.tvm__text--low-emphasis');
    for (let span of locationSpans) {
      let txt = span.innerText ? span.innerText.trim() : '';
      // We take the first one that isn't 'ago' or 'apply'
      if (txt && !txt.toLowerCase().includes('ago') && !txt.toLowerCase().includes('apply')) {
         data.location = txt.replace(/\s*\(.*?\)\s*/g, '').trim();
         break;
      }
    }

    // Method B: Ultra-aggressive Location Extraction (Regex on active card)
    if (!data.location || data.location === '') {
      const activeCard = document.querySelector('.jobs-search-results__list-item--active') || 
                         document.querySelector('.job-card-container--active');
      if (activeCard) {
         const textElements = activeCard.querySelectorAll('li, span, div');
         for (let item of textElements) {
             let txt = item.innerText ? item.innerText.trim() : '';
             let match = txt.match(/^[A-Z][a-zA-Z\-\s]+,\s*[A-Z]{2}/);
             if (match) {
                 data.location = match[0];
                 break;
             }
         }
      }
    }

    // Method C: Regex on top card
    if (!data.location || data.location === '') {
      const topCard = document.querySelector('.job-details-jobs-unified-top-card') || 
                      document.querySelector('.jobs-unified-top-card') ||
                      document.querySelector('.jobs-details__main-content');
      if (topCard) {
         const textElements = topCard.querySelectorAll('span, li, div');
         for (let item of textElements) {
             let txt = item.innerText ? item.innerText.trim() : '';
             let match = txt.match(/^[A-Z][a-zA-Z\-\s]+,\s*[A-Z]{2}/);
             if (match) {
                 data.location = match[0];
                 break;
             }
         }
      }
    }

    // 4. Ultra-aggressive Work Type Extraction
    // We scan all short text snippets inside the job header to find the tags
    const topCardNode = document.querySelector('.job-details-jobs-unified-top-card') || 
                        document.querySelector('.jobs-unified-top-card') ||
                        document.querySelector('.jobs-search__job-details--container') ||
                        document.body;

    if (topCardNode) {
      const allElements = topCardNode.querySelectorAll('span, div, li, a');
      for (let el of allElements) {
        let txt = el.innerText ? el.innerText.trim().toLowerCase() : '';
        // Job tags are usually very short strings (less than 20 chars). 
        // This avoids matching "We work in a hybrid environment" in the job description.
        if (txt.length > 0 && txt.length <= 25) {
          if (txt.includes('on-site') || txt.includes('onsite')) {
            data.workType = 'On-site';
          } else if (txt.includes('hybrid')) {
            data.workType = 'Hybrid';
          } else if (txt.includes('remote')) {
            data.workType = 'Remote';
          }
        }
      }
    }

  } catch (err) {
    console.error("Error parsing LinkedIn job:", err);
  }

  return data;
};
