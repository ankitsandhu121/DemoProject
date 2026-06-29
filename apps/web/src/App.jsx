import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import NavBar from './components/NavBar';
import { AuthContext } from './auth';
import TasksPage from './pages/TasksPage';
import ProjectsPage from './pages/ProjectsPage';
import NewProjectWizard from './pages/NewProjectWizard';
import TeamPage from './pages/TeamPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [token, setToken] = useState(null);

  if (!token) {
    return <LoginForm onLogin={setToken} />;
  }

  return (
    <AuthContext.Provider value={{ token, logout: () => setToken(null) }}>
      <div className="app-shell" data-testid="app-shell">
        <NavBar />
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Navigate to="/tasks" replace />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/new" element={<NewProjectWizard />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </AuthContext.Provider>
  );
}
