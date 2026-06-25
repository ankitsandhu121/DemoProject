import cors from 'cors';
import express from 'express';

const app = express();
app.use(cors());
app.use(express.json());

let tasks = [];
let nextId = 1;

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'demo@taskflow.dev' && password === 'demo1234') {
    return res.json({ token: 'demo-token' });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

function requireAuth(req, res, next) {
  if (req.headers.authorization === 'Bearer demo-token') return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

// Test-only helper: lets e2e setup reset state between runs via the API
// instead of clicking through the UI.
app.post('/api/reset', (req, res) => {
  tasks = [];
  nextId = 1;
  res.json({ ok: true });
});

app.get('/api/tasks', requireAuth, (req, res) => res.json(tasks));

app.post('/api/tasks', requireAuth, (req, res) => {
  const task = { id: nextId++, title: req.body.title, done: false };
  tasks.push(task);
  res.json(tasks);
});

app.patch('/api/tasks/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  tasks = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
  res.json(tasks);
});

app.delete('/api/tasks/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  tasks = tasks.filter((t) => t.id !== id);
  res.json(tasks);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`TaskFlow API on http://localhost:${PORT}`));
