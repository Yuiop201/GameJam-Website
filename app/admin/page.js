'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAdminState, listProjects, listUsers, updateProjectApproval, updateProjectCategory, removeProject, setAdminPassword, signOutAdmin, updateUserRole } from '../../lib/data-service';

export default function AdminPage() {
  const [admin, setAdmin] = useState(null);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const load = async () => {
      const state = await getAdminState();
      if (!state.authenticated) {
        window.location.href = '/admin/login';
        return;
      }
      setAdmin(state.admin);
      const items = await listProjects();
      const allUsers = await listUsers();
      setProjects(items);
      setUsers(allUsers);
    };
    load();
  }, []);

  const handleApprove = async (projectId, approved) => {
    const updated = await updateProjectApproval(projectId, approved);
    if (updated) {
      setProjects((current) => current.map((item) => item.id === projectId ? updated : item));
      setStatus(`Project ${approved ? 'approved' : 'rejected'}.`);
    }
  };

  const handleCategory = async (projectId, category) => {
    const updated = await updateProjectCategory(projectId, category);
    if (updated) {
      setProjects((current) => current.map((item) => item.id === projectId ? updated : item));
      setStatus('Category updated.');
    }
  };

  const handleDelete = async (projectId) => {
    const success = await removeProject(projectId);
    if (success) {
      setProjects((current) => current.filter((item) => item.id !== projectId));
      setStatus('Project removed.');
    }
  };

  const handlePassword = async (event) => {
    event.preventDefault();
    const success = await setAdminPassword(newPassword);
    if (success) {
      setStatus('Password updated.');
      setNewPassword('');
    }
  };

  const handleUserRole = async (userId, role) => {
    const updated = await updateUserRole(userId, role);
    if (updated) {
      setUsers((current) => current.map((user) => user.id === userId ? updated : user));
      setStatus('User role updated.');
    }
  };

  const handleLogout = async () => {
    await signOutAdmin();
    window.location.href = '/admin/login';
  };

  if (!admin) {
    return <main><p className="muted">Checking access…</p></main>;
  }

  return (
    <main>
      <nav>
        <strong>Admin panel</strong>
        <div className="row">
          <Link href="/">Public page</Link>
          <button className="secondary small" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <section className="hero">
        <h1>Moderate submissions and manage the site</h1>
        <p className="muted">Approve or reject uploads, change categories, remove content, and update the admin password.</p>
      </section>

      {status ? <p className="status">{status}</p> : null}

      <div className="grid grid-2">
        <section className="panel">
          <h2>Projects</h2>
          <div className="project-list">
            {projects.map((project) => (
              <article key={project.id} className="project-card">
                <div className="row">
                  <strong>{project.title}</strong>
                  <span className="badge">{project.approved ? 'Approved' : 'Pending'}</span>
                </div>
                <p className="muted">{project.description}</p>
                <div className="row">
                  <select defaultValue={project.category} onChange={(event) => handleCategory(project.id, event.target.value)}>
                    <option value="game">Game</option>
                    <option value="animation">Animation</option>
                    <option value="minecraft_plugin">Minecraft Plugin</option>
                  </select>
                  <button className="small" onClick={() => handleApprove(project.id, true)}>Approve</button>
                  <button className="secondary small" onClick={() => handleApprove(project.id, false)}>Reject</button>
                  <button className="secondary small" onClick={() => handleDelete(project.id)}>Remove</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Users</h2>
          <div className="project-list">
            {users.map((user) => (
              <div key={user.id} className="project-card">
                <strong>{user.name}</strong>
                <p className="muted">{user.email}</p>
                <select defaultValue={user.role} onChange={(event) => handleUserRole(user.id, event.target.value)}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            ))}
          </div>

          <h2>Admin account</h2>
          <form onSubmit={handlePassword}>
            <label>New password</label>
            <input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password" />
            <button type="submit">Update password</button>
          </form>
          <p className="muted">The app is ready for Vercel deployment.</p>
        </section>
      </div>
    </main>
  );
}
