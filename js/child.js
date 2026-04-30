// ── State ─────────────────────────────────────────
let lastSnapshot = null;
let undoTimerId  = null;

const CONFETTI_COLOURS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#A855F7',
  '#3B82F6', '#4ADE80', '#FB923C', '#F472B6'
];
let confettiAnimId = null;
let confettiPieces = [];

// ── Entry point ────────────────────────────────────
document.addEventListener('DOMContentLoaded', render);

window.addEventListener('resize', () => {
  const canvas = document.getElementById('confetti-canvas');
  if (confettiAnimId) {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
});

// ── Main render ────────────────────────────────────
function render() {
  const state = getState();
  renderCountdown(state);
  renderProgress(state);
  renderTasks(state);
  checkCelebration(state);
}

// ── Countdown ──────────────────────────────────────
function renderCountdown(state) {
  const numEl   = document.getElementById('countdown-number');
  const labelEl = document.getElementById('countdown-label');
  const dateEl  = document.getElementById('countdown-date');

  if (!state.yesDayDate) {
    numEl.textContent   = '?';
    labelEl.textContent = 'Ask your parent to set Yes Day!';
    dateEl.textContent  = '';
    numEl.classList.remove('bounce');
    return;
  }

  const days = daysUntil(state.yesDayDate);

  if (days > 0) {
    numEl.textContent   = days;
    labelEl.textContent = days === 1 ? 'day to go! 🎉' : 'days to go! 🎉';
    dateEl.textContent  = formatDate(state.yesDayDate);
    numEl.classList.add('bounce');
  } else if (days === 0) {
    numEl.textContent   = '🎉';
    labelEl.textContent = "IT'S YES DAY!!!";
    dateEl.textContent  = 'TODAY!!!';
    numEl.classList.remove('bounce');
  } else {
    numEl.textContent   = '😢';
    labelEl.textContent = 'Yes Day has passed';
    dateEl.textContent  = formatDate(state.yesDayDate);
    numEl.classList.remove('bounce');
  }
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

// ── Progress bar ───────────────────────────────────
function renderProgress(state) {
  const tasks = state.tasks;
  const progressCard = document.getElementById('progress-card');

  if (!tasks.length) {
    progressCard.style.display = 'none';
    return;
  }

  progressCard.style.display = '';

  const total = tasks.reduce((sum, t) => sum + t.target, 0);
  const done  = tasks.reduce((sum, t) => sum + Math.min(t.completions.length, t.target), 0);
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-pct').textContent  = pct + '%';
  document.getElementById('progress-text').textContent = `${done} of ${total} earned!`;
}

// ── Task rendering ─────────────────────────────────
function renderTasks(state) {
  const positiveTasks = state.tasks.filter(t => t.type === 'positive');
  const negativeTasks = state.tasks.filter(t => t.type === 'negative');

  const posSection = document.getElementById('positive-section');
  const negSection = document.getElementById('negative-section');
  const emptyState = document.getElementById('empty-state');

  posSection.style.display = positiveTasks.length ? '' : 'none';
  negSection.style.display = negativeTasks.length ? '' : 'none';
  emptyState.style.display = !state.tasks.length  ? '' : 'none';

  renderTaskGroup('positive-tasks', positiveTasks);
  renderTaskGroup('negative-tasks', negativeTasks);
}

function renderTaskGroup(containerId, tasks) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  tasks.forEach(task => {
    const completions = Math.min(task.completions.length, task.target);
    const isComplete  = completions >= task.target;

    const card = document.createElement('div');
    card.className = `card task-card ${task.type}${isComplete ? ' complete' : ''}`;

    const badgeLabel = task.type === 'positive' ? '⭐ Earn it' : '🛡️ Keep it';
    const starsHtml  = buildStarsHtml(task.target, completions);

    if (isComplete) {
      card.innerHTML = `
        <span class="task-type-badge">${badgeLabel}</span>
        <div class="task-label">${escapeHtml(task.label)}</div>
        <div class="stars-row">${starsHtml}</div>
        <div class="task-complete-badge">✅ Amazing job — DONE!</div>
      `;
    } else {
      const doItLabel = task.type === 'positive' ? '⭐ I did it!' : '✅ I kept it!';
      const slipBtn   = task.type === 'negative'
        ? `<button class="btn-slip" data-id="${task.id}" data-action="slip">😬 I slipped</button>`
        : '';

      card.innerHTML = `
        <span class="task-type-badge">${badgeLabel}</span>
        <div class="task-label">${escapeHtml(task.label)}</div>
        <div class="stars-row">${starsHtml}</div>
        <div class="task-actions">
          <button class="btn btn-success btn-do-it" data-id="${task.id}" data-action="complete">${doItLabel}</button>
          ${slipBtn}
        </div>
      `;
    }

    container.appendChild(card);
  });
}

function buildStarsHtml(target, filled) {
  return Array.from({ length: target }, (_, i) => {
    const isFilled = i < filled;
    return `<span class="star${isFilled ? ' filled' : ''}" aria-hidden="true">${isFilled ? '⭐' : '☆'}</span>`;
  }).join('');
}

// ── Delegated click handler ────────────────────────
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const taskId = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === 'complete') handleComplete(taskId);
  if (action === 'slip')     handleSlip(taskId);
});

// ── Actions ────────────────────────────────────────
function handleComplete(taskId) {
  const state = getState();
  const task  = state.tasks.find(t => t.id === taskId);
  if (!task || task.completions.length >= task.target) return;

  saveSnapshot(state);
  task.completions.push(new Date().toISOString().slice(0, 10));
  setState(state);
  render();
  showUndo('Logged! ⭐');
}

function handleSlip(taskId) {
  const state = getState();
  const task  = state.tasks.find(t => t.id === taskId);
  if (!task || task.completions.length === 0) return;

  saveSnapshot(state);
  task.completions.pop();
  setState(state);
  render();
  showUndo('Slip recorded 😬');
}

// ── Undo ───────────────────────────────────────────
function saveSnapshot(state) {
  lastSnapshot = JSON.parse(JSON.stringify(state));
}

function showUndo(message) {
  const toast = document.getElementById('undo-toast');
  document.getElementById('undo-message').textContent = message;
  toast.classList.remove('hidden');

  clearTimeout(undoTimerId);
  undoTimerId = setTimeout(() => {
    toast.classList.add('hidden');
    lastSnapshot = null;
  }, 5000);
}

function handleUndo() {
  if (!lastSnapshot) return;
  setState(lastSnapshot);
  lastSnapshot = null;
  clearTimeout(undoTimerId);
  document.getElementById('undo-toast').classList.add('hidden');
  render();
}

// ── Celebration ────────────────────────────────────
function checkCelebration(state) {
  if (!state.tasks.length) {
    hideCelebration();
    return;
  }

  const allDone = state.tasks.every(t => t.completions.length >= t.target);
  if (allDone) {
    showCelebration();
  } else {
    hideCelebration();
  }
}

function showCelebration() {
  document.getElementById('celebration-overlay').classList.remove('hidden');
  startConfetti();
}

function hideCelebration() {
  document.getElementById('celebration-overlay').classList.add('hidden');
  stopConfetti();
}

function dismissCelebration() {
  document.getElementById('celebration-overlay').classList.add('hidden');
  // Keep confetti running in background for a little while
  setTimeout(stopConfetti, 3000);
}

// ── Confetti ───────────────────────────────────────
function startConfetti() {
  if (confettiAnimId) return; // already running

  const canvas = document.getElementById('confetti-canvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  confettiPieces = Array.from({ length: 160 }, () => ({
    x:         Math.random() * canvas.width,
    y:         Math.random() * canvas.height - canvas.height,
    w:         Math.random() * 10 + 6,
    h:         Math.random() * 6  + 4,
    color:     CONFETTI_COLOURS[Math.floor(Math.random() * CONFETTI_COLOURS.length)],
    rotation:  Math.random() * Math.PI * 2,
    speed:     Math.random() * 3 + 2,
    rotSpeed:  (Math.random() - 0.5) * 0.1,
    drift:     (Math.random() - 0.5) * 2
  }));

  function drawFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confettiPieces.forEach(p => {
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();

      p.y        += p.speed;
      p.x        += p.drift;
      p.rotation += p.rotSpeed;

      if (p.y > canvas.height) {
        p.y = -p.h;
        p.x = Math.random() * canvas.width;
      }
    });
    confettiAnimId = requestAnimationFrame(drawFrame);
  }

  drawFrame();
}

function stopConfetti() {
  if (confettiAnimId) {
    cancelAnimationFrame(confettiAnimId);
    confettiAnimId = null;
    const canvas = document.getElementById('confetti-canvas');
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    confettiPieces = [];
  }
}
