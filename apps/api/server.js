import cors from 'cors';
import express from 'express';

const app = express();
app.use(cors());
app.use(express.json());

// --- In-memory stores -------------------------------------------------------
// All state lives in memory and is reset/re-seeded via POST /api/reset so e2e
// runs start from a known baseline.

let tasks = [];
let nextTaskId = 1;

let projects = [];
let nextProjectId = 1;

let members = [];
let nextMemberId = 1;

let profile = {};

function seed() {
  tasks = [];
  nextTaskId = 1;

  projects = [
    { id: 1, name: 'Apollo', owner: 'Ada Lovelace', status: 'active', updated: '2026-06-01' },
    { id: 2, name: 'Gemini', owner: 'Grace Hopper', status: 'paused', updated: '2026-05-20' },
    { id: 3, name: 'Mercury', owner: 'Alan Turing', status: 'active', updated: '2026-06-10' },
    { id: 4, name: 'Voyager', owner: 'Katherine Johnson', status: 'archived', updated: '2026-04-02' },
    { id: 5, name: 'Atlas', owner: 'Ada Lovelace', status: 'active', updated: '2026-06-25' },
    { id: 6, name: 'Orion', owner: 'Grace Hopper', status: 'paused', updated: '2026-03-14' },
    { id: 7, name: 'Pioneer', owner: 'Alan Turing', status: 'active', updated: '2026-06-18' },
  ];
  nextProjectId = 8;

  members = [
    { id: 1, name: 'Ada Lovelace', role: 'Owner', email: 'ada@taskflow.dev' },
    { id: 2, name: 'Grace Hopper', role: 'Admin', email: 'grace@taskflow.dev' },
    { id: 3, name: 'Alan Turing', role: 'Member', email: 'alan@taskflow.dev' },
    { id: 4, name: 'Katherine Johnson', role: 'Member', email: 'katherine@taskflow.dev' },
  ];
  nextMemberId = 5;

  profile = {
    displayName: 'Demo User',
    role: 'Member',
    startDate: '2026-01-15',
    skills: ['playwright', 'react'],
    notifications: { email: true, sms: false },
    digest: 'weekly',
    avatar: null,
  };
}

seed();

// --- Auth -------------------------------------------------------------------

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
// instead of clicking through the UI. Clears AND re-seeds every store.
app.post('/api/reset', (req, res) => {
  seed();
  res.json({ ok: true });
});

// Returns UI config — labels are set server-side so they can't be derived from JSX
app.get('/api/config', (req, res) =>
  res.json({ submitLabel: 'Save task', wizardSubmitLabel: 'Create project' })
);

// --- Tasks ------------------------------------------------------------------

app.get('/api/tasks', requireAuth, (req, res) => res.json(tasks));

app.post('/api/tasks', requireAuth, (req, res) => {
  const task = { id: nextTaskId++, title: req.body.title, done: false };
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

// --- Projects ---------------------------------------------------------------

app.get('/api/projects', requireAuth, (req, res) => res.json(projects));

app.post('/api/projects', requireAuth, (req, res) => {
  const { name, owner = 'Demo User', status = 'active' } = req.body;
  const project = {
    id: nextProjectId++,
    name,
    owner,
    status,
    updated: new Date().toISOString().slice(0, 10),
  };
  projects.push(project);
  res.status(201).json(project);
});

app.patch('/api/projects/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  projects = projects.map((p) => (p.id === id ? { ...p, ...req.body, id } : p));
  res.json(projects.find((p) => p.id === id) || null);
});

app.delete('/api/projects/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  projects = projects.filter((p) => p.id !== id);
  res.json(projects);
});

// --- Members ----------------------------------------------------------------

app.get('/api/members', requireAuth, (req, res) => res.json(members));

app.delete('/api/members/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  members = members.filter((m) => m.id !== id);
  res.json(members);
});

// --- Profile ----------------------------------------------------------------

app.get('/api/profile', requireAuth, (req, res) => res.json(profile));

app.put('/api/profile', requireAuth, (req, res) => {
  profile = { ...profile, ...req.body };
  res.json(profile);
});

// Accepts file metadata only (no multer dependency); the UI still drives a real
// <input type="file"> so Playwright's setInputFiles is exercised.
app.post('/api/profile/avatar', requireAuth, (req, res) => {
  const { filename, size } = req.body;
  profile = { ...profile, avatar: { filename, size } };
  res.json(profile);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`TaskFlow API on http://localhost:${PORT}`));
