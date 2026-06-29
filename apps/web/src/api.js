export async function fetchTasks(token) {
  const res = await fetch('/api/tasks', { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}

export async function addTask(token, title) {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title }),
  });
  return res.json();
}

export async function toggleTask(token, id) {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function deleteTask(token, id) {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// --- Projects ---------------------------------------------------------------

export async function fetchProjects(token) {
  const res = await fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}

export async function createProject(token, project) {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(project),
  });
  return res.json();
}

// --- Members ----------------------------------------------------------------

export async function fetchMembers(token) {
  const res = await fetch('/api/members', { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}

export async function deleteMember(token, id) {
  const res = await fetch(`/api/members/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// --- Profile ----------------------------------------------------------------

export async function fetchProfile(token) {
  const res = await fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}

export async function saveProfile(token, profile) {
  const res = await fetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(profile),
  });
  return res.json();
}

export async function uploadAvatar(token, { filename, size }) {
  const res = await fetch('/api/profile/avatar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ filename, size }),
  });
  return res.json();
}
