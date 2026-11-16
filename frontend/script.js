// =====================================================
//  PostPulse — Social Media Analyzer
//  CS524 Spring 2026 | Stevens Institute of Technology
// =====================================================

// ============================================================
// Replace this with your own Lambda Function URL
// ============================================================
const API_URL = 'YOUR_LAMBDA_FUNCTION_URL_HERE';
// ============================================================

// ---- Sample posts ----
const SAMPLES = {
  positive: `Just tried the new iPhone 16 and honestly it's incredible! The camera quality is outstanding, battery life is amazing, and it charges so fast. Apple has definitely outdone themselves this time. Best upgrade I've made in years! Highly recommended to everyone. 📱✨ #Apple #iPhone #Tech #Upgrade`,

  negative: `Terrible experience with this airline today. Flight delayed 3 hours, lost my luggage, customer service was completely useless and unhelpful. Never flying with them again. The worst travel experience I've ever had. Avoid at all costs! 😡 #BadService #NeverAgain #Disappointed`,

  mixed: `Just finished watching the new season — some episodes were amazing and really exciting, but others felt boring and disappointing. Great visuals and outstanding acting, but the story had some serious problems and flaws. Worth watching but could have been so much better. Conflicted honestly. 🤔 #TVShow #Review`,
};

// ---- Char counter ----
document.getElementById('postInput').addEventListener('input', function () {
  const len = this.value.length;
  const el = document.getElementById('charCounter');
  el.textContent = `${len.toLocaleString()} / 10,000`;
  el.style.color = len > 9000 ? '#ff6b6b' : len > 7000 ? '#ffd166' : '';
});

// ---- Load sample ----
function loadSample(type) {
  const ta = document.getElementById('postInput');
  ta.value = SAMPLES[type];
  ta.dispatchEvent(new Event('input'));
  ta.focus();
}

// ---- Analyze ----
async function analyzePost() {
  const text = document.getElementById('postInput').value.trim();

  // Validate
  hideElement('results');
  hideElement('errorMsg');

  if (!text) {
    showError('Please paste a social media post before analyzing.');
    return;
  }
  if (text.length < 5) {
    showError('Post is too short. Please enter at least a few words.');
    return;
  }

  // Start loading
  const btn = document.getElementById('analyzeBtn');
  btn.disabled = true;
  showElement('loadingState');
  animateLoadingSteps();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    hideElement('loadingState');
    renderResults(data);

  } catch (err) {
    hideElement('loadingState');
    let msg = err.message || 'Something went wrong.';
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      msg = 'Cannot reach the API. Make sure your Lambda Function URL is set correctly in script.js and CORS is enabled.';
    }
    showError(msg);
  } finally {
    btn.disabled = false;
  }
}

// ---- Loading step animation ----
function animateLoadingSteps() {
  const steps = ['step1', 'step2', 'step3', 'step4'];
  steps.forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('active', 'done');
  });
  document.getElementById('step1').classList.add('active');

  let i = 0;
  const interval = setInterval(() => {
    if (i < steps.length - 1) {
      document.getElementById(steps[i]).classList.remove('active');
      document.getElementById(steps[i]).classList.add('done');
      document.getElementById(steps[i]).textContent = '✓ ' + document.getElementById(steps[i]).textContent.replace('⬡ ', '').replace('✓ ', '');
      i++;
      document.getElementById(steps[i]).classList.add('active');
    } else {
      clearInterval(interval);
    }
  }, 500);
}

// ---- Render Results ----
function renderResults(data) {
  // Timestamp / meta
  const ts = data.timestamp ? new Date(data.timestamp).toLocaleString() : '';
  document.getElementById('resultsMeta').textContent = ts ? `Analyzed at ${ts}` : '';

  // Sentiment
  renderSentiment(data.sentiment || {});

  // Stats
  const stats = data.textStatistics || {};
  document.getElementById('statWords').textContent = stats.wordCount ?? '—';
  document.getElementById('statSentences').textContent = stats.sentenceCount ?? '—';
  document.getElementById('statChars').textContent = stats.characterCount ?? '—';
  document.getElementById('statReadability').textContent =
    stats.readabilityScore != null ? Math.round(stats.readabilityScore) : '—';
  document.getElementById('statReadabilityLevel').textContent = stats.readabilityLevel || '';

  // Entities
  renderEntities(data.entities || []);

  // Key Phrases
  renderKeyPhrases(data.keyPhrases || []);

  // Top Words
  renderTopWords((data.textStatistics || {}).topWords || []);

  // Storage note
  if (data.storedAt) {
    document.getElementById('storageNote').textContent = `✓ Results stored in S3: ${data.storedAt}`;
    showElement('storageNote');
  } else if (data.storageNote) {
    document.getElementById('storageNote').textContent = `ℹ ${data.storageNote}`;
    showElement('storageNote');
  } else {
    hideElement('storageNote');
  }

  showElement('results');
  document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---- Render Sentiment ----
function renderSentiment(sentiment) {
  const overall = sentiment.overall || 'NEUTRAL';
  const confidence = sentiment.confidence || '';
  const scores = sentiment.scores || {};

  // Badge
  const badge = document.getElementById('sentimentBadge');
  const emojis = { POSITIVE: '😊 Positive', NEGATIVE: '😠 Negative', NEUTRAL: '😐 Neutral', MIXED: '🤔 Mixed' };
  badge.textContent = emojis[overall] || overall;
  badge.className = `sentiment-badge badge-${overall}`;

  document.getElementById('sentimentConfidence').textContent = `Confidence: ${confidence}`;

  // Bars
  const colors = { Positive: '#00e5a0', Negative: '#ff6b6b', Neutral: '#8b9ab5', Mixed: '#ffd166' };
  const barsEl = document.getElementById('sentimentBars');
  barsEl.innerHTML = '';

  ['Positive', 'Negative', 'Neutral', 'Mixed'].forEach(key => {
    const pct = scores[key] || '0%';
    const num = parseFloat(pct);
    const row = document.createElement('div');
    row.className = 'bar-row';
    row.innerHTML = `
      <span class="bar-name">${key}</span>
      <div class="bar-track">
        <div class="bar-fill" style="width:0%; background:${colors[key]}" data-target="${num}"></div>
      </div>
      <span class="bar-pct">${pct}</span>
    `;
    barsEl.appendChild(row);
  });

  // Animate bars
  requestAnimationFrame(() => {
    document.querySelectorAll('.bar-fill[data-target]').forEach(el => {
      el.style.width = el.dataset.target + '%';
    });
  });

  // Words
  const wordsEl = document.getElementById('sentimentWords');
  wordsEl.innerHTML = '';
  (sentiment.positiveWords || []).slice(0, 8).forEach(w => {
    const chip = document.createElement('span');
    chip.className = 'word-chip pos'; chip.textContent = '+ ' + w;
    wordsEl.appendChild(chip);
  });
  (sentiment.negativeWords || []).slice(0, 8).forEach(w => {
    const chip = document.createElement('span');
    chip.className = 'word-chip neg'; chip.textContent = '− ' + w;
    wordsEl.appendChild(chip);
  });
}

// ---- Render Entities ----
function renderEntities(entities) {
  const grid = document.getElementById('entitiesGrid');
  grid.innerHTML = '';

  if (!entities.length) {
    grid.innerHTML = '<span class="no-entities">No named entities detected.</span>';
    return;
  }

  entities.slice(0, 20).forEach(e => {
    const chip = document.createElement('div');
    chip.className = 'entity-chip';
    chip.innerHTML = `
      <span class="entity-type type-${e.type}">${e.type}</span>
      <span class="entity-text">${escapeHtml(e.text)}</span>
    `;
    grid.appendChild(chip);
  });
}

// ---- Render Key Phrases ----
function renderKeyPhrases(phrases) {
  const list = document.getElementById('phrasesList');
  list.innerHTML = '';

  if (!phrases.length) {
    list.innerHTML = '<span class="no-entities">No key phrases detected.</span>';
    return;
  }

  phrases.slice(0, 10).forEach(p => {
    const chip = document.createElement('span');
    chip.className = 'phrase-chip';
    chip.textContent = p.text;
    list.appendChild(chip);
  });
}

// ---- Render Top Words ----
function renderTopWords(words) {
  const grid = document.getElementById('topWordsGrid');
  grid.innerHTML = '';

  if (!words.length) return;

  words.slice(0, 10).forEach(w => {
    const item = document.createElement('div');
    item.className = 'word-item';
    item.innerHTML = `
      <span class="word-name">${escapeHtml(w.word)}</span>
      <span class="word-count">×${w.count}</span>
    `;
    grid.appendChild(item);
  });
}

// ---- Helpers ----
function showElement(id) { document.getElementById(id)?.classList.remove('hidden'); }
function hideElement(id) { document.getElementById(id)?.classList.add('hidden'); }

function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent = '⚠ ' + msg;
  showElement('errorMsg');
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Allow Enter key submission (Ctrl+Enter)
document.getElementById('postInput').addEventListener('keydown', function (e) {
  if (e.ctrlKey && e.key === 'Enter') analyzePost();
});
