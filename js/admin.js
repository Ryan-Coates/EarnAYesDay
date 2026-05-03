// ── Config ─────────────────────────────────────────
const DEFAULT_PASSWORD = 'EarnAYesDay!';

let editingTaskId = null;

// ── Entry point ────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await ensurePasswordHash();

  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('task-form').addEventListener('submit', handleAddTask);

  // Show/hide target input depending on task type
  document.querySelectorAll('input[name="task-type"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const isNegative = document.querySelector('input[name="task-type"]:checked').value === 'negative';
      document.getElementById('target-group').style.display = isNegative ? 'none' : '';
    });
  });
});

// ── Password initialisation ────────────────────────
async function ensurePasswordHash() {
  const state = getState();
  if (!state.adminPasswordHash) {
    state.adminPasswordHash = await hashPassword(DEFAULT_PASSWORD);
    setState(state);
  }
}

// ── Login ──────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();

  const input   = document.getElementById('password-input');
  const errorEl = document.getElementById('password-error');
  const hash    = await hashPassword(input.value);
  const state   = getState();

  if (hash === state.adminPasswordHash) {
    document.getElementById('password-screen').style.display = 'none';
    document.getElementById('admin-dashboard').classList.add('active');
    renderDashboard();
  } else {
    input.classList.add('error');
    errorEl.textContent = '❌ Wrong password! Try again.';
    input.value = '';
    input.focus();
    setTimeout(() => {
      input.classList.remove('error');
    }, 500);
  }
}

// ── Dashboard ──────────────────────────────────────
function renderDashboard() {
  const state = getState();

  if (state.yesDayDate) {
    document.getElementById('yes-day-date').value = state.yesDayDate;
  }

  renderTaskList(state);
}

// ── Yes Day Date ───────────────────────────────────
function handleSaveDate() {
  const dateVal = document.getElementById('yes-day-date').value;
  if (!dateVal) {
    showToast('❗ Please pick a date first!');
    return;
  }

  const state       = getState();
  state.yesDayDate  = dateVal;
  setState(state);
  showToast('Yes Day date saved! 🎉');
}

// ── Task list ──────────────────────────────────────
function renderTaskList(state) {
  const list = document.getElementById('task-list-admin');
  list.innerHTML = '';

  if (!state.tasks.length) {
    list.innerHTML = '<p style="color:var(--text-light); text-align:center; padding:1rem 0;">No tasks yet — add some below!</p>';
    return;
  }

  state.tasks.forEach(task => {
    const progress   = Math.min(task.completions.length, task.target);
    const typeEmoji  = task.type === 'positive' ? '⭐' : '🚫';
    const isNegative = task.type === 'negative';

    const li = document.createElement('li');
    li.className = `task-item-admin${isNegative ? ' negative' : ''}`;
    li.innerHTML = `
      <span class="task-type-icon">${typeEmoji}</span>
      <span class="task-item-label">${escapeHtml(task.label)}</span>
      <span class="task-item-meta">${isNegative ? `${task.completions.length} strike${task.completions.length !== 1 ? 's' : ''}` : `${progress}/${task.target}`}</span>
      <div class="task-item-actions">
        <button class="btn-icon" data-id="${task.id}" data-action="edit"  title="Edit">✏️</button>
        <button class="btn-icon" data-id="${task.id}" data-action="delete" title="Delete">🗑️</button>
      </div>
    `;
    list.appendChild(li);
  });
}

// Delegated click handling for task list buttons
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const id     = btn.dataset.id;

  if (action === 'edit')   startEditTask(id);
  if (action === 'delete') deleteTask(id);
});

// ── Add / edit task ────────────────────────────────
function handleAddTask(e) {
  e.preventDefault();

  const label  = document.getElementById('task-label-input').value.trim();
  const type   = document.querySelector('input[name="task-type"]:checked').value;
  const target = type === 'negative' ? 1 : parseInt(document.getElementById('task-target-input').value, 10);

  if (!label || (type === 'positive' && (isNaN(target) || target < 1))) return;

  const state = getState();

  if (editingTaskId) {
    const task = state.tasks.find(t => t.id === editingTaskId);
    if (task) {
      task.label  = label;
      task.target = target;
      task.type   = type;
    }
    editingTaskId = null;
    document.getElementById('add-task-btn').textContent = '➕ Add Task';
  } else {
    state.tasks.push({
      id:          generateId(),
      label,
      type,
      target,
      completions: []
    });
  }

  setState(state);
  renderTaskList(state);
  resetTaskForm();
  showToast('Task saved! ✅');
}

function startEditTask(taskId) {
  const state = getState();
  const task  = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  editingTaskId = taskId;
  document.getElementById('task-label-input').value  = task.label;
  document.getElementById('task-target-input').value = task.target;
  document.querySelector(`input[name="task-type"][value="${task.type}"]`).checked = true;
  document.getElementById('target-group').style.display = task.type === 'negative' ? 'none' : '';
  document.getElementById('add-task-btn').textContent = '💾 Save Changes';
  document.getElementById('task-label-input').focus();
  document.getElementById('task-label-input').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function deleteTask(taskId) {
  if (!confirm('Delete this task? Its progress will be lost.')) return;

  const state   = getState();
  state.tasks   = state.tasks.filter(t => t.id !== taskId);
  setState(state);
  renderTaskList(state);
  showToast('Task deleted 🗑️');

  // If we were editing this task, reset the form
  if (editingTaskId === taskId) resetTaskForm();
}

function resetTaskForm() {
  document.getElementById('task-label-input').value  = '';
  document.getElementById('task-target-input').value = '5';
  document.querySelector('input[name="task-type"][value="positive"]').checked = true;
  document.getElementById('target-group').style.display = '';
  document.getElementById('add-task-btn').textContent = '➕ Add Task';
  editingTaskId = null;
}

// ── Reset progress ─────────────────────────────────
function handleResetProgress() {
  if (!confirm('Reset ALL task progress? This cannot be undone!')) return;
  resetProgress();
  renderTaskList(getState());
  showToast('All progress reset 🔄');
}

// ── Toast notification ─────────────────────────────
let adminToastTimer = null;

function showToast(msg) {
  const toast = document.getElementById('admin-toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');

  clearTimeout(adminToastTimer);
  adminToastTimer = setTimeout(() => toast.classList.add('hidden'), 2800);
}
