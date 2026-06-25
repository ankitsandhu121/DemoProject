export default function TaskList({ tasks, onToggle, onDelete }) {
  if (tasks.length === 0) {
    return <p data-testid="task-list-empty">No tasks yet - add one above.</p>;
  }

  return (
    <ul data-testid="task-list">
      {tasks.map((task) => (
        <li key={task.id} data-testid={`task-item-${task.id}`} className={task.done ? 'done' : ''}>
          <span>{task.title}</span>
          <button data-testid={`task-complete-${task.id}`} onClick={() => onToggle(task.id)}>
            {task.done ? 'Mark active' : 'Mark done'}
          </button>
          <button data-testid={`task-delete-${task.id}`} onClick={() => onDelete(task.id)}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
