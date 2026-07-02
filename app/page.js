'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createProject, getAdminState, listProjects } from '../lib/data-service';

const initialForm = {
  title: '',
  description: '',
  category: 'game',
  demo_url: '',
  file: null
};

export default function HomePage() {
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const items = await listProjects();
      setProjects(items.filter((project) => project.approved));
      const admin = await getAdminState();
      setAuthenticated(admin.authenticated);
      setLoading(false);
    };
    load();
  }, []);

  const visibleProjects = filter === 'all'
    ? projects
    : projects.filter((project) => project.category === filter);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('Submitting your project...');
    const created = await createProject({
      title: form.title,
      description: form.description,
      category: form.category,
      demo_url: form.demo_url,
      file: form.file
    });

    if (created) {
      setProjects((current) => [created, ...current]);
      setForm(initialForm);
      setStatus('Project submitted! It will appear after an admin approves it.');
    } else {
      setStatus('Something went wrong while saving your project.');
    }
  };

  return (
    <main>
      <nav>
        <strong>Markus Game Jams</strong>
        <div className="row">
          {!authenticated ? <Link href="/admin/login">Admin login</Link> : null}
          {authenticated ? <Link href="/admin">Admin panel</Link> : null}
        </div>
      </nav>

      <section className="hero">
        <h1>Showcase your jam creations and let the community vote with their eyes.</h1>
        <p>Anyone can submit a project, and admins review each upload before it goes live. Share a playable build, a short animation, or a Minecraft plugin and add a demo link when you have one.</p>
      </section>

      <div className="grid grid-2">
        <section className="card">
          <h2>Submit a project</h2>
          <form onSubmit={handleSubmit}>
            <label>Project name</label>
            <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="My jam entry" />

            <label>Description</label>
            <textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Tell people what you built and what makes it special." />

            <div className="form-row">
              <div>
                <label>Category</label>
                <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                  <option value="game">Game</option>
                  <option value="animation">Animation</option>
                  <option value="minecraft_plugin">Minecraft Plugin</option>
                </select>
              </div>
              <div>
                <label>Demo link (optional)</label>
                <input value={form.demo_url} onChange={(event) => setForm({ ...form, demo_url: event.target.value })} placeholder="https://example.com" />
              </div>
            </div>

            <label>Upload file</label>
            <input type="file" onChange={(event) => setForm({ ...form, file: event.target.files?.[0] || null })} />

            <button type="submit">Submit project</button>
            {status ? <p className="status">{status}</p> : null}
          </form>
        </section>

        <section className="card">
          <h2>Browse approved projects</h2>
          <label>Filter</label>
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">All</option>
            <option value="game">Games</option>
            <option value="animation">Animations</option>
            <option value="minecraft_plugin">Minecraft Plugins</option>
          </select>

          {loading ? <p className="muted">Loading projects…</p> : (
            <div className="project-list">
              {visibleProjects.length === 0 ? <p className="muted">No projects yet. Be the first to submit one.</p> : visibleProjects.map((project) => (
                <article key={project.id} className="project-card">
                  <span className="badge">{project.category === 'minecraft_plugin' ? 'Minecraft Plugin' : project.category}</span>
                  <h3>{project.title}</h3>
                  <p className="muted">{project.description}</p>
                  {project.demo_url ? <p><a href={project.demo_url} target="_blank" rel="noreferrer">Open demo</a></p> : null}
                  {project.file_url ? <p><a href={project.file_url} target="_blank" rel="noreferrer">Download file</a></p> : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
