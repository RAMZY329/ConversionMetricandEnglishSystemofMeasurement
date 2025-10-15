/* Practice mode for unit conversions (Metric & English/US) */
let practiceScore = 0;
let practiceTimer = null;
let timeLeft = 60;
let solvedProblems = [];
let lastProblem = null;

function formatNumber(n) {
  const num = Number(n);
  if (!isFinite(num)) return String(n);
  if (Number.isInteger(num)) return String(num);
  return parseFloat(num.toFixed(3)).toString();
}

function generateDistractors(answer, question, count) {
  const base = Number(answer);
  const distractors = new Set();
  const isInt = Math.abs(base - Math.round(base)) < 1e-9;

  while (distractors.size < count) {
    let cand;
    if (isInt) {
      const jitter = Math.max(1, Math.floor(Math.abs(base) * 0.1));
      cand = base + (Math.floor(Math.random() * (jitter * 2 + 1)) - jitter);
    } else {
      const pct = (Math.random() * 0.2) - 0.1; // ±10%
      cand = base * (1 + pct);
    }
    if (!Number.isFinite(cand)) continue;
    cand = Number(Number(cand).toFixed(3));
    if (cand === base) continue;
    distractors.add(cand);
  }

  return Array.from(distractors).slice(0, count);
}

function initPractice() {
  const section = document.getElementById('practice-section');
  section.innerHTML = `
    <h2>🔁 Conversions Practice</h2>
    <div style="background: linear-gradient(135deg, #e8f5ff, #e0f7fa); padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #0288d1;">
      <p style="margin: 0; color: #0277bd; font-weight: bold;">Practice converting between Metric and English/US units (length, mass, volume)</p>
    </div>
    <div style="display:flex; justify-content:center; gap:1rem; align-items:center; flex-wrap:wrap;">
      <label for="time-select" style="font-weight:bold;">⏱️ Practice Time:</label>
      <input id="time-select" type="number" value="60" min="10" max="600" style="width:80px;">
      <button id="start-btn">🚀 Start Practice</button>
      <button id="example-btn">💡 Show Example</button>
    </div>
    <div style="display:flex; justify-content:center; gap:0.5rem; margin-top:0.5rem;">
      <label for="player-name" style="font-weight:bold;">Your name:</label>
      <input id="player-name" type="text" placeholder="Enter name (optional)" style="width:200px;">
    </div>
    <div style="margin:1rem 0; display:flex; justify-content:center; gap:2rem; flex-wrap:wrap;">
      <p>⏰ Timer: <span id="timer" style="font-weight:bold;">0</span>s</p>
      <p>🏆 Score: <span id="score" style="font-weight:bold;">0</span></p>
    </div>
    <div id="problem"></div>
    <div id="example"></div>
    <div id="summary"></div>
  `;

  document.getElementById('start-btn').addEventListener('click', startPractice);
  document.getElementById('example-btn').addEventListener('click', showExample);
}

function startPractice() {
  const t = Number(document.getElementById('time-select').value) || 60;
  timeLeft = Math.max(10, Math.min(600, t));
  practiceScore = 0;
  solvedProblems = [];
  updatePracticeDisplay();
  document.getElementById('summary').innerHTML = '';
  document.getElementById('example').innerHTML = '';

  if (practiceTimer) clearInterval(practiceTimer);
  practiceTimer = setInterval(() => {
    timeLeft--;
    updatePracticeDisplay();
    if (timeLeft <= 0) {
      clearInterval(practiceTimer);
      practiceTimer = null;
      endPractice();
    }
  }, 1000);

  generatePracticeProblem();
}

function generatePracticeProblem() {
  const problemEl = document.getElementById('problem');
  const problem = getProblem();
  lastProblem = problem;
  const { question, answer } = problem;

  // generate 3 distractors
  const distractors = generateDistractors(answer, question, 3);
  const options = [Number(answer), ...distractors].map(n => Number(n));
  // shuffle
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  problemEl.innerHTML = `
    <p style="font-weight:bold;">${question}</p>
    <div id="options" class="options-container"></div>
  `;

  const optionsDiv = document.getElementById('options');
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = formatNumber(opt);
    btn.addEventListener('click', () => {
      const isCorrect = Number(opt) === Number(answer);
      practiceScore += isCorrect ? 1 : -1;
      solvedProblems.push({ question, correct: answer, chosen: opt, result: isCorrect ? '✅' : '❌' });
      updatePracticeDisplay();
      document.getElementById('example').innerHTML = '';
      // small delay so user sees feedback if desired
      setTimeout(generatePracticeProblem, 150);
    });
    optionsDiv.appendChild(btn);
  });
}

function updatePracticeDisplay() {
  const scoreEl = document.getElementById('score');
  const timerEl = document.getElementById('timer');
  if (scoreEl) scoreEl.textContent = practiceScore;
  if (timerEl) timerEl.textContent = timeLeft;
}

function endPractice() {
  if (practiceTimer) { clearInterval(practiceTimer); practiceTimer = null; }
  document.getElementById('problem').innerHTML = '';
  document.getElementById('example').innerHTML = '';
  const summaryEl = document.getElementById('summary');
  summaryEl.innerHTML = `
    <h3>Practice Over ⏰</h3>
    <p>Final Score: ${practiceScore}</p>
    <h4>Summary:</h4>
    <ul>
      ${solvedProblems.map(p => `<li>${p.question} = ${formatNumber(p.correct)} | Your Answer: ${formatNumber(p.chosen)} ${p.result}</li>`).join('')}
    </ul>
  `;

  // optional: submit to gforms if configured
  try {
    if (typeof isGFormConfigured === 'function' && isGFormConfigured()) {
      const name = (document.getElementById('player-name') || {}).value || 'Anonymous';
      if (typeof sendScoreToGoogleForm === 'function') {
        sendScoreToGoogleForm(name, practiceScore, { mode: 'practice' }).catch(() => {});
      }
    }
  } catch (e) {
    console.warn('gforms submission error', e);
  }
}

function showExample() {
  // If the current problem uses a recognizable "Convert <value> <from> to <to>" structure,
  // prefer an example that uses the same from/to units but a different numeric value.
  const currentQuestion = (lastProblem && lastProblem.question) || null;
  let exampleProblem = null;

  // Try to parse current units
  let desiredFrom = null;
  let desiredTo = null;
  if (currentQuestion) {
    const mcur = currentQuestion.match(/Convert\s+([0-9.]+)\s+([^\s]+)\s+to\s+([^\s(]+)/i);
    if (mcur) {
      desiredFrom = mcur[2];
      desiredTo = mcur[3];
    }
  }

  if (desiredFrom && desiredTo) {
    // Prefer same-unit-structure examples (up to 20 attempts)
    for (let attempt = 0; attempt < 20; attempt++) {
      const p = getProblem();
      const mp = (p && p.question) ? p.question.match(/Convert\s+([0-9.]+)\s+([^\s]+)\s+to\s+([^\s(]+)/i) : null;
      if (mp && mp[2] === desiredFrom && mp[3] === desiredTo && p.question !== currentQuestion) {
        exampleProblem = p;
        break;
      }
    }
  }

  // If no same-structure example found, fall back to generating any different question (up to 10 attempts)
  if (!exampleProblem) {
    for (let attempt = 0; attempt < 10; attempt++) {
      const p = getProblem();
      if (!currentQuestion || p.question !== currentQuestion) {
        exampleProblem = p;
        break;
      }
    }
  }

  // Final fallback
  if (!exampleProblem) exampleProblem = lastProblem || getProblem();

  showConversionExample(exampleProblem);
}

function showConversionExample(problem) {
  const q = problem.question || '';
  const ans = problem.answer;
  // Try to parse: Convert <value> <from> to <to>
  const m = q.match(/Convert\s+([0-9.]+)\s+([^\s]+)\s+to\s+([^\s(]+)/i);
  let explanation = '';
  if (m) {
    const value = m[1];
    const fromUnit = m[2];
    const toUnit = m[3];
    explanation = `Method: Convert ${value} ${fromUnit} to base units, then to ${toUnit}.\nCalculated answer: ${formatNumber(ans)} ${toUnit}`;
  } else {
    explanation = `Answer: ${formatNumber(ans)}`;
  }

  document.getElementById('example').innerHTML = `
    <div style="background: #e3f2fd; padding: 1rem; border-radius: 8px; border-left: 4px solid #1e88e5;">
      <h4 style="color: #1565c0; margin-bottom: 0.5rem;">🔁 Worked Conversion Example</h4>
      <p style="margin-bottom: 0.5rem;"><strong>Problem:</strong> ${q}</p>
      <p style="margin-bottom: 0.5rem;"><strong>Solution:</strong> ${explanation.replace(/\n/g, '<br>')}</p>
      <p style="margin-bottom: 0; font-weight: bold; color: #1976d2;">Answer: ${formatNumber(ans)}</p>
    </div>
  `;
}
