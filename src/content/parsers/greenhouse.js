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
