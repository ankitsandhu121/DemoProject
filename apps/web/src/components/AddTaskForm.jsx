import { useState } from 'react';

export default function AddTaskForm({ onAdd }) {
  const [title, setTitle] = useState('');

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
      <button type="submit" data-testid="add-task-submit">
        Add task
      </button>
    </form>
  );
}
