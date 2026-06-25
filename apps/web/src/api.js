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
