import { useState } from 'react';

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError('Invalid email or password');
        return;
      }
      const data = await res.json();
      onLogin(data.token);
    } catch {
      setError('Unable to reach the server');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h1>TaskFlow</h1>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        data-testid="login-email-input"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <label htmlFor="password">Password</label>
      <input
        id="password"
        data-testid="login-password-input"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && (
        <p data-testid="login-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" data-testid="login-submit-button">
        Log in
      </button>
    </form>
  );
}
