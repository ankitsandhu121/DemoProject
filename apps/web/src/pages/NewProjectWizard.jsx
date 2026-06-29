import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../api';
import { useAuth } from '../auth';

const STEPS = ['Details', 'Settings', 'Review'];

export default function NewProjectWizard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'active',
    visibility: 'private',
  });
  const [error, setError] = useState('');
  const [submitLabel, setSubmitLabel] = useState('Create project');

  useEffect(() => {
    fetch('http://localhost:4000/api/config')
      .then((r) => r.json())
      .then((cfg) => cfg.wizardSubmitLabel && setSubmitLabel(cfg.wizardSubmitLabel))
      .catch(() => {});
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function next() {
    // Step 1 requires a project name before advancing.
    if (step === 0 && !form.name.trim()) {
      setError('Project name is required');
      return;
    }
    setError('');
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  function back() {
    setError('');
    setStep((s) => Math.max(0, s - 1));
  }

  async function submit() {
    await createProject(token, {
      name: form.name.trim(),
      owner: 'Demo User',
      status: form.status,
    });
    navigate('/projects');
  }

  return (
    <div className="wizard" data-testid="project-wizard">
      <h1>New project</h1>

      <ol className="wizard-steps" data-testid="wizard-steps">
        {STEPS.map((label, i) => (
          <li key={label} className={i === step ? 'current' : undefined} data-testid={`wizard-step-${i}`}>
            {label}
          </li>
        ))}
      </ol>

      {error && (
        <p className="form-error" role="alert" data-testid="wizard-error">
          {error}
        </p>
      )}

      {step === 0 && (
        <fieldset data-testid="wizard-step-details">
          <label htmlFor="project-name">Name</label>
          <input
            id="project-name"
            data-testid="wizard-name-input"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
          />
          <label htmlFor="project-description">Description</label>
          <textarea
            id="project-description"
            data-testid="wizard-description-input"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </fieldset>
      )}

      {step === 1 && (
        <fieldset data-testid="wizard-step-settings">
          <label htmlFor="project-status">Status</label>
          <select
            id="project-status"
            data-testid="wizard-status-select"
            value={form.status}
            onChange={(e) => update('status', e.target.value)}
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </select>

          <p>Visibility</p>
          {/* no data-testid: radios force a role/name fallback locator getByRole('radio', { name: 'Private' }) */}
          <label>
            <input
              type="radio"
              name="visibility"
              value="private"
              checked={form.visibility === 'private'}
              onChange={(e) => update('visibility', e.target.value)}
            />
            Private
          </label>
          <label>
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={form.visibility === 'public'}
              onChange={(e) => update('visibility', e.target.value)}
            />
            Public
          </label>
        </fieldset>
      )}

      {step === 2 && (
        <dl className="wizard-review" data-testid="wizard-review">
          <dt>Name</dt>
          <dd data-testid="review-name">{form.name}</dd>
          <dt>Description</dt>
          <dd data-testid="review-description">{form.description || '—'}</dd>
          <dt>Status</dt>
          <dd data-testid="review-status">{form.status}</dd>
          <dt>Visibility</dt>
          <dd data-testid="review-visibility">{form.visibility}</dd>
        </dl>
      )}

      <div className="wizard-actions">
        {/* no data-testid: Back/Next force role/name fallback locators */}
        {step > 0 && (
          <button className="btn-secondary" onClick={back}>
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button className="btn-primary" onClick={next}>
            Next
          </button>
        ) : (
          <button className="btn-primary" data-testid="wizard-submit" onClick={submit}>
            {submitLabel}
          </button>
        )}
      </div>
    </div>
  );
}
