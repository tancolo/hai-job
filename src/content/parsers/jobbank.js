// Jobbank Parser
if (!window.HaiJobParsers) {
  window.HaiJobParsers = {};
}

window.HaiJobParsers.jobbank = function() {
  const data = {
    company: '',
    location: '',
    title: '',
    url: window.location.href,
    platform: 'Jobbank',
    workType: ''
  };

  try {
    // 1. Job Title
    const title = document.querySelector('[property="title"]')?.innerText.trim() || 
                  document.querySelector('h1')?.innerText.trim();
    if (title) data.title = title;

    // 2. Company Name
    const company = document.querySelector('[property="hiringOrganization"] [property="name"]')?.innerText.trim() || 
                    document.querySelector('.hiringOrganization strong')?.innerText.trim() ||
                    document.querySelector('span[property="name"]')?.innerText.trim();
    if (company) data.company = company;

    // 3. Location and 4. Work Type
    const items = Array.from(document.querySelectorAll('li'));
    items.forEach(li => {
      const text = li.innerText.trim();
      if (text.startsWith('Location')) {
        // Remove the word 'Location' and normalize spaces
        data.location = text.replace('Location', '').trim().replace(/\s+/g, ' ');
      } else if (text.startsWith('Work location') || text.startsWith('Work conditions')) {
        let wt = text.replace('Work location', '').replace('Work conditions', '').trim().toLowerCase();
        if (wt.includes('remote') || wt.includes('telework')) data.workType = 'Remote';
        else if (wt.includes('hybrid')) data.workType = 'Hybrid';
        else if (wt.includes('on site') || wt.includes('onsite') || wt.includes('in person')) data.workType = 'On-site';
      }
    });

    // Fallback for Location
    if (!data.location) {
      const city = document.querySelector('.city')?.innerText.trim();
      const province = document.querySelector('.province')?.innerText.trim();
      if (city && province) data.location = `${city}, ${province}`;
      else if (city) data.location = city;
    }

    // Fallback for Work Type
    if (!data.workType) {
      const bodyText = document.body.innerText.toLowerCase();
      if (bodyText.includes('telework') || bodyText.includes('remote')) {
        data.workType = 'Remote';
      } else if (bodyText.includes('hybrid')) {
        data.workType = 'Hybrid';
      } else if (bodyText.includes('on site') || bodyText.includes('onsite')) {
        data.workType = 'On-site';
      }
    }
  } catch (err) {
    console.error("Error parsing Jobbank job:", err);
  }

  return data;
};
