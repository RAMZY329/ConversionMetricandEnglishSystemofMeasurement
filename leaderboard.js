// leaderboard.js
// Client-side code to fetch and render a top-10 leaderboard from an Apps Script Web App

// Deployed Apps Script /exec URL (returns JSON array of {name,score,timestamp})
const LEADERBOARD_URL = "https://script.google.com/macros/s/AKfycbw51dk3x_enz9pGvBFx1VC0tbWfGb66_CLrQxWYZxe0h8zDWVc606yXcefm6S-s_ngK/exec";

// Fetch leaderboard JSON. If CORS blocks, fallback to JSONP by calling fetchLeaderboardJSONP
async function fetchLeaderboardJSON() {
  if (!LEADERBOARD_URL) throw new Error('LEADERBOARD_URL not configured');
  const res = await fetch(LEADERBOARD_URL, { cache: 'no-cache' });
  if (!res.ok) throw new Error('Leaderboard fetch failed');
  return res.json();
}

// JSONP fallback: dynamically insert a script tag with callback
function fetchLeaderboardJSONP(timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    if (!LEADERBOARD_URL) return reject(new Error('LEADERBOARD_URL not configured'));
    const cbName = '__lb_cb_' + Date.now();
    window[cbName] = function(data) {
      resolve(data);
      try { delete window[cbName]; } catch (e) {}
      const s = document.getElementById(cbName + '_script');
      if (s && s.parentNode) s.parentNode.removeChild(s);
    };
    const url = LEADERBOARD_URL + (LEADERBOARD_URL.includes('?') ? '&' : '?') + 'callback=' + cbName;
    const s = document.createElement('script');
    s.src = url;
    s.id = cbName + '_script';
    s.onerror = function(e) {
      try { delete window[cbName]; } catch (er) {}
      reject(new Error('JSONP script load error'));
    };
    document.body.appendChild(s);
    setTimeout(() => {
      if (window[cbName]) {
        try { delete window[cbName]; } catch (e) {}
        if (s && s.parentNode) s.parentNode.removeChild(s);
        reject(new Error('JSONP timeout'));
      }
    }, timeoutMs);
  });
}

function sanitizeName(name) {
  if (!name) return 'Anonymous';
  // Normalize string and remove zero-width/invisible characters that may corrupt display
  let s = String(name);
  try {
    s = s.normalize('NFKC');
  } catch (e) {
    // normalize may not be supported in some environments; ignore
  }
  // Remove common zero-width/invisible chars (ZWSP, ZWNJ, ZWJ, BOM)
  s = s.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
  s = s.trim();
  if (s.length === 0) return 'Anonymous';
  return s.length > 30 ? s.slice(0, 30) + '…' : s;
}

function renderLeaderboard(el, rows) {
  el.innerHTML = '';
  el.innerHTML = `
    <div class="leaderboard-card">
      <div class="leaderboard-header">🏆 Top 10 Leaderboard</div>
      <ol class="leaderboard-list"></ol>
      <div class="leaderboard-note">Leaderboard shows highest score per student.</div>
    </div>
  `;

  const ol = el.querySelector('.leaderboard-list');

  if (!rows || rows.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No entries yet.';
    el.appendChild(p);
    return;
  }

  rows.forEach((r, idx) => {
    const li = document.createElement('li');
    li.className = 'leaderboard-item';
    const name = sanitizeName(r.name || r.player || r.student || 'Anonymous');
    const score = typeof r.score === 'number' ? r.score : Number(r.score) || 0;

    li.innerHTML = `
      <div class="leaderboard-rank">${idx + 1}</div>
      <div class="leaderboard-entry">
        <div class="leaderboard-name">${escapeHtml(name)}</div>
        <div class="leaderboard-score">${score}</div>
      </div>
    `;
    ol.appendChild(li);
  });
}

// simple escape to avoid injection when inserting names
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Top-level function called by main.js when user opens leaderboard
async function loadLeaderboard() {
  const el = document.getElementById('leaderboard-section');
  if (!el) return;
  el.innerHTML = '<p>Loading leaderboard…</p>';

  // internal helper to fetch+render (used for initial load and polling)
  async function fetchAndRender() {
    try {
      let data;
      try {
        data = await fetchLeaderboardJSON();
      } catch (e) {
        // try JSONP fallback
        console.warn('Leaderboard fetch failed, trying JSONP fallback', e);
        data = await fetchLeaderboardJSONP();
      }

      // Aggregate highest score per name
      const byName = {};
      if (Array.isArray(data)) {
        data.forEach(item => {
          const name = sanitizeName(item.name || item.player || item.student || 'Anonymous');
          const score = Number(item.score) || 0;
          const ts = item.timestamp || item.time || '';
          if (!byName[name] || score > byName[name].score) {
            byName[name] = { name, score, timestamp: ts };
          }
        });
      }

      const rows = Object.keys(byName).map(k => byName[k]);
      rows.sort((a,b) => b.score - a.score || new Date(a.timestamp) - new Date(b.timestamp));
      const top10 = rows.slice(0, 10);
      renderLeaderboard(el, top10);
    } catch (err) {
      console.error('Failed to load leaderboard', err);
      el.innerHTML = '<p>Failed to load leaderboard. Try again later.</p>';
    }
  }

  // Run once immediately
  await fetchAndRender();

  // Start polling. Store interval id on the element to avoid duplicates if loadLeaderboard is called again.
  const POLL_MS = 10000; // 10 seconds
  if (el._lb_interval) {
    clearInterval(el._lb_interval);
  }
  el._lb_interval = setInterval(fetchAndRender, POLL_MS);
}

// Optional helper to stop auto-refreshing (call when leaving the page)
function stopLeaderboardAutoRefresh() {
  const el = document.getElementById('leaderboard-section');
  if (el && el._lb_interval) {
    clearInterval(el._lb_interval);
    delete el._lb_interval;
  }
}

// Expose stop function for other modules
window.stopLeaderboardAutoRefresh = stopLeaderboardAutoRefresh;
