// Greenhouse Parser
if (!window.HaiJobParsers) {
  window.HaiJobParsers = {};
}

window.HaiJobParsers.greenhouse = function() {
  const data = {
    company: '',
    location: '',
    title: '',
    url: window.location.href,
    platform: 'Greenhouse',
    workType: ''
  };

  try {
    // 1. Job Title
    const title = document.querySelector('.app-title')?.innerText.trim() || 
                  document.querySelector('h1')?.innerText.trim();
    if (title) data.title = title;

    // 2. Company Name
    const company = document.querySelector('.company-name')?.innerText.trim() || 
                    document.querySelector('#header img')?.alt?.replace('Logo', '').trim() ||
                    (document.title.includes(' at ') ? document.title.split(' at ')[1].trim() : '');
    
    if (company) {
      data.company = company;
    } else {
      // Fallback: extract from URL if possible
      // Example: https://boards.greenhouse.io/radixark/jobs/4130434009
      const match = window.location.href.match(/greenhouse\.io\/([^/]+)/);
      if (match && match[1] && match[1] !== 'embed') {
        // Capitalize first letter
        data.company = match[1].charAt(0).toUpperCase() + match[1].slice(1);
      }
    }

    // 3. Location
    let location = document.querySelector('.location')?.innerText.trim() ||
                   document.querySelector('meta[property="og:description"]')?.content?.trim();
    
    // Fallback for location looking for "Based in..."
    if (!location) {
      const basedInMatch = document.body.innerText.match(/Based in\s+([^(\n]+)/i);
      if (basedInMatch && basedInMatch[1]) {
          location = basedInMatch[1].trim();
      }
    }

    if (location) data.location = location;

    // 4. Work Type
    // Greenhouse often doesn't have a distinct "Work Type" tag, but it's usually in the location or title.
    const bodyText = document.body.innerText.toLowerCase();
    
    if (location && location.toLowerCase().includes('remote')) {
      data.workType = 'Remote';
    } else if (title && title.toLowerCase().includes('remote')) {
      data.workType = 'Remote';
    } else if (bodyText.includes('remote') || bodyText.includes('telecommute')) {
      data.workType = 'Remote';
    } else if (bodyText.includes('hybrid')) {
      data.workType = 'Hybrid';
    } else if (bodyText.includes('on-site') || bodyText.includes('onsite') || bodyText.includes('in-office')) {
      data.workType = 'On-site';
    }

  } catch (err) {
    console.error("Error parsing Greenhouse job:", err);
  }

  return data;
};

// Listen for autofill messages from sidepanel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'autofill_greenhouse' && request.profile) {
    const p = request.profile;
    
    const setVal = (selector, val) => {
      if (!val) return;
      const el = document.querySelector(selector);
      if (el) {
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    // Standard IDs
    setVal('#first_name', p.firstName);
    setVal('#last_name', p.lastName);
    setVal('#email', p.email);
    setVal('#phone', p.phone);

    // Fuzzy matching for custom fields (LinkedIn / GitHub)
    if (p.linkedin || p.github) {
      const labels = Array.from(document.querySelectorAll('label'));
      labels.forEach(label => {
        const text = label.innerText.toLowerCase();
        // Check if label contains linkedin or github
        let targetVal = null;
        if (p.linkedin && text.includes('linkedin')) targetVal = p.linkedin;
        else if (p.github && text.includes('github')) targetVal = p.github;
        
        if (targetVal) {
          // Find the nearest input within or next to this label
          // In greenhouse, usually label contains the input or input is sibling
          let input = label.querySelector('input[type="text"], input[type="url"]');
          if (!input && label.htmlFor) {
            input = document.getElementById(label.htmlFor);
          }
          if (!input) {
             // Try to find an input in the same parent container
             const parent = label.closest('div');
             if (parent) input = parent.querySelector('input[type="text"], input[type="url"]');
          }

          if (input) {
            input.value = targetVal;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      });
    }

    sendResponse({ success: true });
  }
});
