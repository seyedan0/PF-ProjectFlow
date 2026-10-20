const API_BASE = '/api/pf';

export async function fetchProjectState(isDemo = false) {
  const url = `${API_BASE}/state${isDemo ? '?demo=true' : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch state: ${res.statusText}`);
  }
  return res.json();
}

export async function saveProjectFile(fileKey, data, isDemo = false) {
  const url = `${API_BASE}/state/${fileKey}${isDemo ? '?demo=true' : ''}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || `Failed to save ${fileKey}: ${res.statusText}`);
  }
  return res.json();
}

export async function bundlePrompt(taskId = null, isDemo = false) {
  const url = `${API_BASE}/bundle-prompt${isDemo ? '?demo=true' : ''}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to bundle prompt: ${res.statusText}`);
  }
  return res.json();
}

export async function syncRules() {
  const res = await fetch(`${API_BASE}/sync-rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to sync rules: ${res.statusText}`);
  }
  return res.json();
}

export async function resetControlState() {
  const res = await fetch(`${API_BASE}/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to reset state: ${res.statusText}`);
  }
  return res.json();
}
