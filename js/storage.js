const STORAGE_KEY = 'earnAYesDay_v1';

/**
 * Returns the full app state from localStorage.
 * Provides a safe default if nothing is stored yet.
 */
function getState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { yesDayDate: null, adminPasswordHash: null, tasks: [] };
    return JSON.parse(raw);
  } catch {
    return { yesDayDate: null, adminPasswordHash: null, tasks: [] };
  }
}

/**
 * Persists the full app state to localStorage.
 */
function setState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Clears all task completions but keeps tasks and settings intact.
 */
function resetProgress() {
  const state = getState();
  state.tasks = state.tasks.map(t => ({ ...t, completions: [] }));
  setState(state);
}
