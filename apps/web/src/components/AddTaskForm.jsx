import { useState, useEffect } from 'react';

export default function AddTaskForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [submitLabel, setSubmitLabel] = useState('...');

  useEffect(() => {
    fetch('http://localhost:4000/api/config')
      .then((r) => r.json())
      .then((cfg) => setSubmitLabel(cfg.submitLabel))
      .catch(() => setSubmitLabel('Add task'));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await onAdd(title.trim());
    setTitle('');
  }

  return (
    <form onSubmit={handleSubmit} className="add-task-form">
      <input
        data-testid="add-task-input"
        placeholder="Add a new task..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
