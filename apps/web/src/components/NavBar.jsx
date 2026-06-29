import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth';

const links = [
  { to: '/tasks', label: 'Tasks', testid: 'nav-tasks' },
  { to: '/projects', label: 'Projects', testid: 'nav-projects' },
  { to: '/team', label: 'Team', testid: 'nav-team' },
  { to: '/settings', label: 'Settings', testid: 'nav-settings' },
];

export default function NavBar() {
  const { logout } = useAuth();

  return (
    <nav className="navbar" data-testid="navbar">
      <span className="navbar-brand">TaskFlow</span>
      <ul className="navbar-links">
        {links.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              data-testid={link.testid}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
      {/* no data-testid: exercises a role/name fallback locator getByRole('button', { name: 'Log out' }) */}
      <button className="navbar-logout" onClick={logout}>
        Log out
      </button>
    </nav>
  );
}
