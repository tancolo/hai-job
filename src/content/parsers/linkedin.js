/**
 * Parses LinkedIn job postings.
 *
 * LinkedIn frequently changes its DOM class names. To stay resilient, this
 * parser uses a multi-layer defensive strategy for each field:
 *
 * Layer 1: The exact class names confirmed via Chrome Inspector (most reliable)
 * Layer 2: Partial class name matching via querySelectorAll + Array.find()
 * Layer 3: Semantic tag fallbacks (h1, a[href*="company"])
 * Layer 4: Text-pattern regex scanning across the whole page header area
 */
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

  // Helper: find the first element whose className contains ALL of the given fragments
  function findByPartialClass(fragments, root = document) {
    const all = root.querySelectorAll('*');
    for (let el of all) {
      const cls = el.className && typeof el.className === 'string' ? el.className : '';
      if (fragments.every(f => cls.includes(f))) {
        const txt = (el.innerText || '').trim();
        if (txt) return el;
      }
    }
    return null;
  }

  try {
    // ─── 1. JOB TITLE ─────────────────────────────────────────────────────────
    // Layer 1: Exact confirmed class (div, not h1!) from Chrome Inspector
    //   → div.t-24.job-details-jobs-unified-top-card__job-title
    // Layer 2: Partial match on "job-details-jobs-unified-top-card__job-title"
    // Layer 3: Older SPA class names
    // Layer 4: topcard__ (guest/direct URL view)
    // Layer 5: Any h1 on the page
    const titleEl =
      document.querySelector('div.job-details-jobs-unified-top-card__job-title') ||
      document.querySelector('.job-details-jobs-unified-top-card__job-title') ||
      document.querySelector('.jobs-unified-top-card__job-title h1') ||
      document.querySelector('.jobs-unified-top-card__job-title a') ||
      document.querySelector('.jobs-unified-top-card__job-title') ||
      document.querySelector('h1.topcard__title') ||
      document.querySelector('h1.t-24.t-bold') ||
      findByPartialClass(['job-details', 'top-card', 'job-title']) ||
      document.querySelector('h1');

    if (titleEl) data.title = titleEl.innerText.trim();

    // ─── 2. COMPANY NAME ──────────────────────────────────────────────────────
    // Layer 1: Exact confirmed class from Chrome Inspector
    //   → div.job-details-jobs-unified-top-card__company-name
    // Layer 2: With inner <a> child (some LinkedIn UI variants wrap it in a link)
    // Layer 3: Older SPA class names
    // Layer 4: topcard__ (guest/direct URL view)
    const companyEl =
      document.querySelector('div.job-details-jobs-unified-top-card__company-name') ||
      document.querySelector('.job-details-jobs-unified-top-card__company-name a') ||
      document.querySelector('.job-details-jobs-unified-top-card__company-name') ||
      document.querySelector('.jobs-unified-top-card__company-name a') ||
      document.querySelector('.jobs-unified-top-card__company-name') ||
      document.querySelector('a.topcard__org-name-link') ||
      document.querySelector('.topcard__flavor a') ||
      findByPartialClass(['job-details', 'company-name']);

    if (companyEl) data.company = companyEl.innerText.trim();

    // ─── 3. LOCATION ──────────────────────────────────────────────────────────
    // Layer 1 (confirmed): span.tvm__text.tvm__text--low-emphasis
    //   The first span that isn't "X hours ago" or "Apply" is the city
    const locationSpans = document.querySelectorAll('span.tvm__text.tvm__text--low-emphasis');
    for (let span of locationSpans) {
      let txt = (span.innerText || '').trim();
      if (txt && !txt.toLowerCase().includes('ago') && !txt.toLowerCase().includes('apply')) {
        data.location = txt.replace(/\s*\(.*?\)\s*/g, '').trim();
        break;
      }
    }

    // Layer 2: Logged-in SPA bullet span
    if (!data.location) {
      const bulletEl =
        document.querySelector('.job-details-jobs-unified-top-card__bullet') ||
        document.querySelector('.jobs-unified-top-card__bullet') ||
        document.querySelector('.jobs-unified-top-card__location');
      if (bulletEl) {
        data.location = bulletEl.innerText.trim().replace(/\s*\(.*?\)\s*/g, '').trim();
      }
    }

    // Layer 3: Guest / direct URL view — topcard flavor bullet
    if (!data.location) {
      for (let span of document.querySelectorAll('span.topcard__flavor--bullet')) {
        let txt = (span.innerText || '').trim();
        if (txt && !txt.toLowerCase().includes('ago')) {
          data.location = txt.replace(/\s*\(.*?\)\s*/g, '').trim();
          break;
        }
      }
    }

    // Layer 4: Ultra-aggressive — regex scan for "City, Province" pattern
    if (!data.location) {
      const scanRoot =
        document.querySelector('.job-details-jobs-unified-top-card') ||
        document.querySelector('.jobs-unified-top-card') ||
        document.querySelector('.jobs-search__job-details--container') ||
        document.querySelector('.top-card-layout') ||
        document.body;
      for (let el of scanRoot.querySelectorAll('li, span, div')) {
        let txt = (el.innerText || '').trim();
        // Match "Calgary, AB" / "Greater Toronto Area, Ontario" / "Toronto, ON"
        let match = txt.match(/^[A-Z][a-zA-Z\-\s]+,\s*[A-Z][a-zA-Z\s]+/);
        if (match && txt.length < 80) {
          data.location = match[0];
          break;
        }
      }
    }

    // ─── 4. WORK TYPE ─────────────────────────────────────────────────────────
    // Scan the job header area for short pill-style tags like "Remote", "Hybrid", "On-site"
    // We limit to <=25 chars to avoid matching full sentences in the job description body.
    const workTypeRoot =
      document.querySelector('.job-details-jobs-unified-top-card') ||
      document.querySelector('.jobs-unified-top-card') ||
      document.querySelector('.jobs-search__job-details--container') ||
      document.querySelector('.top-card-layout') ||
      document.body;

    if (workTypeRoot) {
      for (let el of workTypeRoot.querySelectorAll('span, div, li, a')) {
        let txt = (el.innerText || '').trim().toLowerCase();
        if (txt.length > 0 && txt.length <= 25) {
          if (txt.includes('on-site') || txt.includes('onsite')) {
            data.workType = 'On-site'; break;
          } else if (txt.includes('hybrid')) {
            data.workType = 'Hybrid'; break;
          } else if (txt.includes('remote')) {
            data.workType = 'Remote'; break;
          }
        }
      }
    }

  } catch (err) {
    console.error("Error parsing LinkedIn job:", err);
  }

  return data;
};
