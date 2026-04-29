// Utility to translate static HTML elements using data-i18n attributes
document.addEventListener('DOMContentLoaded', () => {
  const translateElements = () => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const msg = chrome.i18n.getMessage(key);
      if (msg) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          if (el.hasAttribute('placeholder')) {
            el.setAttribute('placeholder', msg);
          }
        } else {
          // Preserve child elements if there are specific icons inside buttons, 
          // but for this simple app, textContent is safer.
          // If we need to preserve inner HTML (like an icon), we might need a more complex structure,
          // but for Hai Job, buttons are just text.
          el.textContent = msg;
        }
      }
    });
  };

  translateElements();
});
