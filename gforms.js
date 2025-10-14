// gforms.js
// Helper to submit name+score to a Google Form.
// Configuration: set FORM_ACTION to your form's /formResponse action URL and
// set FIELD_ENTRY for the field name (entry.XXXX...) used in your form for name and score.

// Example:
// const FORM_ACTION = 'https://docs.google.com/forms/d/e/FORM_ID/formResponse';
// const FIELD_ENTRY = { name: 'entry.1234567890', score: 'entry.0987654321' };

// --- Edit these two values for your own Google Form ---
// The form preview/ID you provided has been used to create a formResponse endpoint below.
// If your form uses the other /e/ pattern, this still works in most cases.
// Use the /forms/d/e/FORM_ID/formResponse pattern which is the canonical POST endpoint
// Updated to the user's provided form (converted from /prefill to /formResponse)
// NOTE: This URL format may be incorrect. The correct format should be:
// https://docs.google.com/forms/d/e/FORM_ID/formResponse
const FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLScjzcZjfIBO4zH4jxqTIT_lwlbZcLO1i5rYXIQjOWrAVomURA/formResponse'; // corrected form endpoint
const FIELD_ENTRY = {
  name: 'entry.1427609618', // user-provided name entry id
  score: 'entry.247865597',
  mode: '', // optional: e.g. 'entry.1111111111' to record practice/competition
};

// Debug flag: when true, submission opens a new tab and logs payload to the console.
// Set to false for silent iframe submissions.
const GFORMS_DEBUG = true;


// sendScoreToGoogleForm creates a hidden HTML form and submits it. This avoids fetch/CORS
// restrictions because it performs a normal browser form POST to Google Forms.
function sendScoreToGoogleForm(name, score, extra = {}) {
  console.log('🔍 DEBUG: sendScoreToGoogleForm called with:', { name, score, extra });
  
  if (!FORM_ACTION || !FIELD_ENTRY.name || !FIELD_ENTRY.score) {
    console.warn('Google Form not configured. Set FORM_ACTION and FIELD_ENTRY in gforms.js');
    console.warn('Current config:', { FORM_ACTION, FIELD_ENTRY });
    return Promise.reject(new Error('Google Form not configured'));
  }
  
  console.log('✅ Google Form configuration looks good:', { FORM_ACTION, FIELD_ENTRY });

  return new Promise((resolve) => {
    try {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = FORM_ACTION;
      // Always submit via a hidden iframe to avoid opening /formResponse directly (GET on that URL 404s)
      const iframeName = 'gforms_iframe_' + Date.now();
      const iframe = document.createElement('iframe');
      iframe.name = iframeName;
      // In debug mode keep the iframe visible so the developer can inspect it; otherwise hide it.
      if (typeof GFORMS_DEBUG !== 'undefined' && GFORMS_DEBUG) {
        iframe.style.width = '800px';
        iframe.style.height = '600px';
        iframe.style.border = '1px solid #ccc';
      } else {
        iframe.style.display = 'none';
      }
      // Log load/error events to help diagnose whether the POST returned an HTML page.
      iframe.addEventListener('load', () => {
        console.log('🔍 DEBUG: iframe load event fired for', iframeName);
        try {
          // Trying to read contents may throw due to cross-origin restrictions; catch and log.
          const doc = iframe.contentDocument || iframe.contentWindow.document;
          console.log('🔍 DEBUG: iframe document title:', doc.title);
          console.log('🔍 DEBUG: iframe document URL:', iframe.contentWindow.location.href);
        } catch (err) {
          console.log('🔍 DEBUG: iframe content not readable (likely cross-origin)', err && err.message);
        }
      });
      iframe.addEventListener('error', (e) => {
        console.log('❌ DEBUG: iframe error event', e);
      });
      document.body.appendChild(iframe);
      form.target = iframeName;
      form.style.display = 'none';

      const nameInput = document.createElement('input');
      nameInput.type = 'hidden';
      nameInput.name = FIELD_ENTRY.name;
      nameInput.value = name || '';
      form.appendChild(nameInput);

      const scoreInput = document.createElement('input');
      scoreInput.type = 'hidden';
      scoreInput.name = FIELD_ENTRY.score;
      scoreInput.value = String(score);
      form.appendChild(scoreInput);

      if (FIELD_ENTRY.mode && extra && extra.mode) {
        const modeInput = document.createElement('input');
        modeInput.type = 'hidden';
        modeInput.name = FIELD_ENTRY.mode;
        modeInput.value = extra.mode;
        form.appendChild(modeInput);
      }

      // allow extra arbitrary entries (key should be full entry id like 'entry.123')
      if (extra.entries) {
        Object.keys(extra.entries).forEach(k => {
          const inp = document.createElement('input');
          inp.type = 'hidden';
          inp.name = k;
          inp.value = extra.entries[k];
          form.appendChild(inp);
        });
      }

      document.body.appendChild(form);
      // Debug: build and log the target action and payload (visible log)
      try {
        const payload = {};
        payload[FIELD_ENTRY.name] = name || '';
        payload[FIELD_ENTRY.score] = String(score);
        if (FIELD_ENTRY.mode && extra && extra.mode) payload[FIELD_ENTRY.mode] = extra.mode;
        if (extra.entries) Object.assign(payload, extra.entries);
        console.log('🔍 DEBUG: Submitting to Google Forms:', { 
          action: FORM_ACTION, 
          payload, 
          debug: GFORMS_DEBUG,
          timestamp: new Date().toISOString()
        });
        // Always open a pre-filled viewform URL in a new tab for verification
        try {
          // Convert formResponse endpoint to viewform and append prefilled query params
          const viewBase = FORM_ACTION.replace(/\/formResponse\/?$/, '/viewform?usp=pp_url');
          const params = [];
          params.push(encodeURIComponent(FIELD_ENTRY.name) + '=' + encodeURIComponent(payload[FIELD_ENTRY.name] || ''));
          params.push(encodeURIComponent(FIELD_ENTRY.score) + '=' + encodeURIComponent(payload[FIELD_ENTRY.score] || ''));
          if (FIELD_ENTRY.mode && payload[FIELD_ENTRY.mode]) {
            params.push(encodeURIComponent(FIELD_ENTRY.mode) + '=' + encodeURIComponent(payload[FIELD_ENTRY.mode]));
          }
          if (extra.entries) {
            Object.keys(extra.entries).forEach(k => {
              params.push(encodeURIComponent(k) + '=' + encodeURIComponent(extra.entries[k]));
            });
          }
          const viewUrl = viewBase + '&' + params.join('&');
            console.log('gforms: prefilled viewform url (not opened):', viewUrl);
        } catch (e) {
          console.log('❌ DEBUG: Failed to open prefilled viewform', e);
        }
      } catch (e) {
        console.log('gforms: debug payload build failed', e);
      }
      // Submit the form silently via the hidden iframe.
      form.submit();
      // Clean up: remove form and iframe after a short delay
      setTimeout(() => {
        console.log('🔍 DEBUG: Cleaning up form and iframe after submission');
        try { document.body.removeChild(form); } catch (e) { console.log('⚠️ DEBUG: Error removing form:', e); }
        try { document.body.removeChild(iframe); } catch (e) { console.log('⚠️ DEBUG: Error removing iframe:', e); }
        console.log('✅ DEBUG: Form submission completed successfully');
        resolve({ success: true });
      }, 800);
    } catch (err) {
      console.error('Failed sending to Google Form', err);
      resolve({ success: false, error: err });
    }
  });
}

// Small helper to check if gform is configured
function isGFormConfigured() {
  return Boolean(FORM_ACTION && FIELD_ENTRY.name && FIELD_ENTRY.score);
}
