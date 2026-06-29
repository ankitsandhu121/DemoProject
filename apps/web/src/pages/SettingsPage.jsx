import { useEffect, useState } from 'react';
import Toast from '../components/Toast';
import { fetchProfile, saveProfile, uploadAvatar } from '../api';
import { useAuth } from '../auth';

const SKILL_OPTIONS = ['playwright', 'react', 'node', 'typescript', 'css'];
const ROLE_OPTIONS = ['Owner', 'Admin', 'Member', 'Viewer'];

export default function SettingsPage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [avatarName, setAvatarName] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (token) fetchProfile(token).then(setProfile);
  }, [token]);

  if (!profile) return <p data-testid="settings-loading">Loading…</p>;

  function update(field, value) {
    setProfile((p) => ({ ...p, [field]: value }));
  }

  function toggleSkill(skill) {
    setProfile((p) => {
      const has = p.skills.includes(skill);
      return { ...p, skills: has ? p.skills.filter((s) => s !== skill) : [...p.skills, skill] };
    });
  }

  async function handleAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarName(file.name);
    await uploadAvatar(token, { filename: file.name, size: file.size });
  }

  async function handleSave(e) {
    e.preventDefault();
    const saved = await saveProfile(token, profile);
    setProfile(saved);
    setToast('Settings saved');
  }

  return (
    <div className="settings-page" data-testid="settings-page">
      <h1>Settings</h1>

      <form onSubmit={handleSave} className="settings-form">
        <label htmlFor="display-name">Display name</label>
        <input
          id="display-name"
          data-testid="settings-name-input"
          value={profile.displayName}
          onChange={(e) => update('displayName', e.target.value)}
        />

        <label htmlFor="avatar">Avatar</label>
        <input
          id="avatar"
          type="file"
          data-testid="settings-avatar-input"
          onChange={handleAvatar}
        />
        {avatarName && <span data-testid="settings-avatar-name">{avatarName}</span>}

        <label htmlFor="start-date">Start date</label>
        <input
          id="start-date"
          type="date"
          data-testid="settings-date-input"
          value={profile.startDate}
          onChange={(e) => update('startDate', e.target.value)}
        />

        <label htmlFor="role">Role</label>
        <select
          id="role"
          data-testid="settings-role-select"
          value={profile.role}
          onChange={(e) => update('role', e.target.value)}
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <fieldset data-testid="settings-skills">
          <legend>Skills</legend>
          {SKILL_OPTIONS.map((skill) => (
            <label key={skill}>
              <input
                type="checkbox"
                data-testid={`skill-${skill}`}
                checked={profile.skills.includes(skill)}
                onChange={() => toggleSkill(skill)}
              />
              {skill}
            </label>
          ))}
        </fieldset>

        <fieldset data-testid="settings-digest">
          <legend>Email digest</legend>
          {/* no data-testid: digest radios force a role/name fallback locator */}
          {['daily', 'weekly', 'never'].map((freq) => (
            <label key={freq}>
              <input
                type="radio"
                name="digest"
                value={freq}
                checked={profile.digest === freq}
                onChange={(e) => update('digest', e.target.value)}
              />
              {freq}
            </label>
          ))}
        </fieldset>

        <button type="submit" data-testid="settings-save">
          Save settings
        </button>
      </form>

      <Toast message={toast} onDismiss={() => setToast('')} />
    </div>
  );
}
