/**
 * Parses LinkedIn job postings.
 *
 * Supports three views:
 *   1. Logged-in SPA collections (/jobs/collections/): split layout, scope to right panel
 *   2. Logged-in direct view (/jobs/view/): hashed CSS classes — use data attributes + exclusion
 *   3. Guest / not logged-in: topcard__ classes
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

  // Work type keywords to exclude from location detection
  const WORK_TYPE_WORDS = ['remote', 'hybrid', 'on-site', 'onsite', 'full-time',
                           'part-time', 'contract', 'internship', 'temporary', 'volunteer'];

  // Validate a candidate title string — reject upsell/navigation/premium content
  function isValidJobTitle(txt) {
    if (!txt || txt.length < 3 || txt.length > 150) return false;
    if (/premium|ca\$|\$0|upsell|subscribe/i.test(txt)) return false;
    if (/^(use ai|get ai|show match|tailor|help you|about the job|job search|looking for)/i.test(txt)) return false;
    if (/^(home|jobs|network|messaging|notifications?)/i.test(txt)) return false;
    return true;
  }

  // Helper: reject strings that are obviously NOT locations
  function isLocationText(txt) {
    if (!txt || txt.length < 2 || txt.length > 80) return false;
    if (/\d{4}/.test(txt)) return false;
    if (/ago|apply|applicant|repost|promot|response|manag/i.test(txt)) return false;
    if (WORK_TYPE_WORDS.some(w => txt.toLowerCase() === w)) return false;
    return true;
  }

  try {
    // ── STEP 0: Find main job detail panel (works for split-layout pages) ────
    const mainPanel =
      document.querySelector('.job-details-jobs-unified-top-card__container') ||
      document.querySelector('.jobs-search__job-details--container') ||
      document.querySelector('.jobs-details__main-content') ||
      document.querySelector('.scaffold-layout__detail') ||
      document.querySelector('.job-view-layout') ||
      document.querySelector('.job-details-jobs-unified-top-card') ||
      document.querySelector('.jobs-unified-top-card') ||
      document.querySelector('.top-card-layout') ||
      document.querySelector('.topcard');

    const scope = mainPanel || document;

    // ── 1. JOB TITLE ─────────────────────────────────────────────────────────

    // Layer 1: Semantic class names (works for /jobs/collections/ split view)
    let titleEl =
      scope.querySelector('div.job-details-jobs-unified-top-card__job-title') ||
      scope.querySelector('.job-details-jobs-unified-top-card__job-title') ||
      scope.querySelector('.jobs-unified-top-card__job-title h1') ||
      scope.querySelector('.jobs-unified-top-card__job-title') ||
      scope.querySelector('h1.topcard__title') ||
      scope.querySelector('h1.top-card-layout__title') ||
      scope.querySelector('h1.t-24.t-bold');

    // Layer 2: Parse page <title> tag — stable SEO metadata, unaffected by CSS changes.
    // LinkedIn format: "Job Title | LinkedIn" or "Job Title hiring now | LinkedIn"
    // Used primarily for /jobs/view/ direct URLs (logged-in, hashed-class layout).
    if (!titleEl && /\/jobs\/view\//i.test(window.location.pathname)) {
      const rawPageTitle = document.title || '';
      if (rawPageTitle) {
        // Strip everything after the first " | " separator (" | LinkedIn" suffix)
        const candidate = rawPageTitle.split(' | ')[0]
          .replace(/\s+hiring now\s*$/i, '')
          .replace(/\s+at\s+.+$/, '')  // strip " at CompanyName" if present
          .trim();
        if (isValidJobTitle(candidate) && candidate !== data.company) {
          data.title = candidate;
        }
      }
    }

    // Layer 3: data-display-contents — secondary fallback for /jobs/view/ hashed layout.
    // Guards: skip elements with componentkey (premium/upsell) and skip company name.
    if (!data.title) {
      const displayDivs = Array.from(
        document.querySelectorAll('[data-display-contents="true"]')
      );
      for (let div of displayDivs) {
        const p = div.querySelector('p:not([componentkey])');
        if (!p) continue;
        const firstTextNode = Array.from(p.childNodes)
          .find(n => n.nodeType === 3 && n.textContent.trim());
        const candidate = firstTextNode
          ? firstTextNode.textContent.trim()
          : (p.innerText || '').trim().split('\n')[0].trim();
        // Exclude company name and invalid titles
        if (isValidJobTitle(candidate) && candidate !== data.company) {
          data.title = candidate;
          break;
        }
      }
    }

    // Layer 4: h1/h2 fallback — skip LinkedIn nav & premium elements
    if (!data.title) {
      const headings = Array.from(scope.querySelectorAll('h1, h2'));
      const titleEl4 = headings.find(h => {
        const txt = (h.innerText || '').trim();
        return isValidJobTitle(txt) &&
               txt !== data.company &&
               !h.closest('nav') &&
               !h.closest('header');
      }) || null;
      if (titleEl4) {
        data.title = (titleEl4.innerText || '').trim().split('\n')[0].trim();
      }
    }

    // Layer 1 result: set data.title from class-based titleEl if not yet set
    if (!data.title && titleEl) {
      const firstTextNode = Array.from(titleEl.childNodes)
        .find(n => n.nodeType === 3 && n.textContent.trim());
      data.title = firstTextNode
        ? firstTextNode.textContent.trim()
        : (titleEl.innerText || '').trim().split('\n')[0].trim();
    }

    // ── 2. COMPANY NAME ──────────────────────────────────────────────────────
    const companyEl =
      scope.querySelector('div.job-details-jobs-unified-top-card__company-name') ||
      scope.querySelector('.job-details-jobs-unified-top-card__company-name a') ||
      scope.querySelector('.job-details-jobs-unified-top-card__company-name') ||
      scope.querySelector('.jobs-unified-top-card__company-name a') ||
      scope.querySelector('.jobs-unified-top-card__company-name') ||
      scope.querySelector('a.topcard__org-name-link') ||
      scope.querySelector('.topcard__flavor a') ||
      scope.querySelector('a[href*="/company/"]');     // Semantic: always stable

    if (companyEl) {
      data.company = (companyEl.innerText || '').trim().split('\n')[0].trim();
    }

    // ── 3. LOCATION ──────────────────────────────────────────────────────────

    // Method A: tvm__text spans (collections split view — confirmed by inspector)
    // Split on "·" to handle "Canada · Reposted 1 week ago" → take "Canada"
    for (let span of scope.querySelectorAll('span.tvm__text, span.tvm__text--low-emphasis')) {
      const parts = (span.innerText || '').split('·').map(p => p.trim());
      const loc = parts.find(p => isLocationText(p));
      if (loc) { data.location = loc.replace(/\s*\(.*?\)\s*/g, '').trim(); break; }
    }

    // Method B: Semantic bullet classes (split view)
    if (!data.location) {
      const bulletEl =
        scope.querySelector('.job-details-jobs-unified-top-card__bullet') ||
        scope.querySelector('.job-details-jobs-unified-top-card__tertiary-description-container span') ||
        scope.querySelector('.jobs-unified-top-card__bullet') ||
        scope.querySelector('.jobs-unified-top-card__location');
      if (bulletEl) {
        const parts = (bulletEl.innerText || '').split('·').map(p => p.trim());
        const loc = parts.find(p => isLocationText(p));
        if (loc) data.location = loc.replace(/\s*\(.*?\)\s*/g, '').trim();
      }
    }

    // Method C: Guest topcard
    if (!data.location) {
      for (let span of scope.querySelectorAll('span.topcard__flavor--bullet')) {
        const txt = (span.innerText || '').trim();
        if (isLocationText(txt)) {
          data.location = txt.replace(/\s*\(.*?\)\s*/g, '').trim(); break;
        }
      }
    }

    // Method D: /jobs/view/ logged-in with hashed classes.
    // Inspector confirmed: location is in a <span> with a short single-word class.
    // Use the title container sibling approach: find <p> elements near data-display-contents.
    if (!data.location) {
      const titleContainer = document.querySelector('[data-display-contents="true"]');
      if (titleContainer) {
        const parent = titleContainer.parentElement;
        if (parent) {
          // Sibling <p> elements after the title div contain location
          const siblingPs = parent.querySelectorAll('p');
          for (let p of siblingPs) {
            // Skip the title p itself
            if (p === titleEl) continue;
            // First <span> child is typically the location text
            const firstSpan = p.querySelector('span');
            if (firstSpan) {
              const txt = (firstSpan.innerText || '').trim();
              if (isLocationText(txt)) {
                data.location = txt.replace(/\s*\(.*?\)\s*/g, '').trim();
                break;
              }
            }
          }
        }
      }
    }

    // Method E: Last resort — scan all spans on page for geographic text.
    // Strict: must match "City, XX" or a capitalised word/phrase, not a work type.
    if (!data.location) {
      for (let span of document.querySelectorAll('span')) {
        if (span.closest('nav') || span.closest('header')) continue;
        const txt = (span.innerText || '').trim();
        if (!isLocationText(txt)) continue;
        // "City, Province" with 2-3 uppercase letter code
        if (/^[A-Z][a-zA-Z\s\-]+,\s*[A-Z]{2,3}$/.test(txt)) {
          data.location = txt; break;
        }
        // Country or metro area (1-3 capitalised words, no numbers)
        if (/^[A-Z][a-zA-Z]+(\s[A-Z][a-zA-Z]+){0,2}$/.test(txt) && txt.length <= 40) {
          data.location = txt; break;
        }
      }
    }

    // ── 4. WORK TYPE ─────────────────────────────────────────────────────────
    // Scan within scope; use exact match on short pill-style elements only.
    const wtRoot = mainPanel || document;
    for (let el of wtRoot.querySelectorAll('span, li')) {
      const txt = (el.innerText || '').trim().toLowerCase();
      if (txt === 'on-site' || txt === 'onsite') { data.workType = 'On-site'; break; }
      else if (txt === 'hybrid')                  { data.workType = 'Hybrid';  break; }
      else if (txt === 'remote')                  { data.workType = 'Remote';  break; }
    }

  } catch (err) {
    console.error('Error parsing LinkedIn job:', err);
  }

  return data;
};
