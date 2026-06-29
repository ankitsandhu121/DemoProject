import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchProjects } from '../api';
import { useAuth } from '../auth';

const PAGE_SIZE = 3;
const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'owner', label: 'Owner' },
  { key: 'status', label: 'Status' },
  { key: 'updated', label: 'Updated' },
];

export default function ProjectsPage() {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (token) fetchProjects(token).then(setProjects);
  }, [token]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q
      ? projects.filter((p) =>
          [p.name, p.owner, p.status].some((v) => v.toLowerCase().includes(q))
        )
      : projects;
    const sorted = [...rows].sort((a, b) => {
      const cmp = String(a[sort.key]).localeCompare(String(b[sort.key]));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [projects, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function toggleSort(key) {
    setPage(1);
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
  }

  return (
    <div className="projects-page" data-testid="projects-page">
      <div className="page-header">
        <h1>Projects</h1>
        <Link to="/projects/new" data-testid="new-project-link" className="btn-primary">
          New project
        </Link>
      </div>

      <input
        data-testid="projects-search"
        className="search-input"
        placeholder="Filter projects..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPage(1);
        }}
      />

      <table className="data-table" data-testid="projects-table">
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              // no data-testid: sort headers force a role/text fallback locator
              // getByRole('columnheader', { name: /Name/ }) or getByRole('button', { name: ... })
              <th key={col.key}>
                <button className="sort-header" onClick={() => toggleSort(col.key)}>
                  {col.label}
                  {sort.key === col.key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageRows.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS.length} data-testid="projects-empty">
                No projects match your filter.
              </td>
            </tr>
          ) : (
            pageRows.map((p) => (
              <tr key={p.id} data-testid={`project-row-${p.id}`}>
                <td data-testid={`project-name-${p.id}`}>{p.name}</td>
                <td>{p.owner}</td>
                <td>{p.status}</td>
                <td>{p.updated}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="pagination" data-testid="pagination">
        <button
          data-testid="page-prev"
          disabled={currentPage <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </button>
        <span data-testid="page-indicator">
          Page {currentPage} of {totalPages}
        </span>
        <button
          data-testid="page-next"
          disabled={currentPage >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}
