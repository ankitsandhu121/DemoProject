export default function TaskList({ tasks, onToggle, onDelete }) {
  if (tasks.length === 0) {
    return <p>No tasks yet - add one above.</p>;
  }

  return (
    <ul data-testid="task-list">
      {tasks.map((task) => (
        <li key={task.id} data-testid={`task-item-${task.id}`} className={task.done ? 'done' : ''}>
          <span>{task.title}</span>
          <button onClick={() => onToggle(task.id)}>
            {task.done ? 'Mark active' : 'Mark done'}
          </button>
          <button onClick={() => onDelete(task.id)}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
