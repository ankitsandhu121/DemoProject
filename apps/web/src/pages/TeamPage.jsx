import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { deleteMember, fetchMembers } from '../api';
import { useAuth } from '../auth';

export default function TeamPage() {
  const { token } = useAuth();
  const [members, setMembers] = useState([]);
  const [pending, setPending] = useState(null); // member queued for removal
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (token) fetchMembers(token).then(setMembers);
  }, [token]);

  async function confirmRemove() {
    const removed = pending;
    setMembers(await deleteMember(token, removed.id));
    setPending(null);
    setToast(`${removed.name} removed from the team`);
  }

  return (
    <div className="team-page" data-testid="team-page">
      <h1>Team</h1>

      <ul className="member-list" data-testid="member-list">
        {members.map((m) => (
          <li key={m.id} data-testid={`member-row-${m.id}`} className="member-row">
            <span data-testid={`member-name-${m.id}`}>{m.name}</span>
            <span className="member-role">{m.role}</span>
            <button
              data-testid={`member-remove-${m.id}`}
              className="btn-danger"
              onClick={() => setPending(m)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <Modal
        open={Boolean(pending)}
        title="Remove member"
        message={pending ? `Remove ${pending.name} from the team?` : ''}
        confirmLabel="Remove"
        onConfirm={confirmRemove}
        onCancel={() => setPending(null)}
      />

      <Toast message={toast} onDismiss={() => setToast('')} />
    </div>
  );
}
