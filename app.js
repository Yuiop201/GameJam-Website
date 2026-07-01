const seedProjects = [
  {
    id: 1,
    title: 'Star Hopper',
    type: 'game',
    description: 'A fast arcade runner with neon visuals and time-based obstacles.',
    link: '#',
    ownerId: 2,
    file: { name: 'star-hopper.zip', type: 'application/zip', size: 1200 }
  },
  {
    id: 2,
    title: 'Aurora Loop',
    type: 'animation',
    description: 'A looping animation that explores light trails and soft motion.',
    link: '#',
    ownerId: 2,
    file: { name: 'aurora-loop.mp4', type: 'video/mp4', size: 1800 }
  },
  {
    id: 3,
    title: 'Procedural Maze',
    type: 'mc-plugin',
    description: 'A lightweight Minecraft plugin prototype with procedural rooms.',
    link: '#',
    ownerId: 2,
    file: { name: 'procedural-maze.jar', type: 'application/java-archive', size: 2400 }
  }
];

const defaultUsers = [
  { id: 1, name: 'Admin User', email: 'admin@markus.com', password: 'admin123', role: 'admin' },
  { id: 2, name: 'Mina', email: 'mina@example.com', password: 'pass123', role: 'user' }
];

function readStorage(key, fallback) {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : fallback;
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function initDefaults() {
  if (!localStorage.getItem('markus-projects')) {
    writeStorage('markus-projects', seedProjects);
  }
  if (!localStorage.getItem('markus-users')) {
    writeStorage('markus-users', defaultUsers);
  }
}

function renderNavigation() {
  const accountLink = document.getElementById('nav-account-link');
  const loginLink = document.getElementById('nav-login-link');
  const session = readStorage('markus-session', null);

  if (accountLink) {
    accountLink.classList.toggle('hidden', !session);
  }
  if (loginLink) {
    loginLink.classList.toggle('hidden', !!session);
  }
}

function renderProjects() {
  const container = document.getElementById('project-list');
  if (!container) return;

  const projects = readStorage('markus-projects', []);
  container.innerHTML = projects.map((project) => `
    <article class="project-card">
      <span class="badge">${project.type === 'mc-plugin' ? 'Minecraft plugin' : project.type}</span>
      <h3>${project.title}</h3>
      <p>${project.description}</p>
      <p class="muted">${project.file ? `Uploaded file: ${project.file.name}` : 'No file uploaded'}</p>
      <div class="hero-actions">
        <a class="btn btn-secondary" href="${project.link || '#'}">Open</a>
      </div>
    </article>
  `).join('');
}

function renderAccountDashboard() {
  const prompt = document.getElementById('account-login-prompt');
  const dashboard = document.getElementById('account-dashboard');
  const logoutButton = document.getElementById('logout-btn');
  const accountHeading = document.getElementById('account-heading');
  const accountName = document.getElementById('account-name');
  const accountProjects = document.getElementById('account-projects');

  if (!prompt || !dashboard || !logoutButton || !accountHeading || !accountName || !accountProjects) return;

  const session = readStorage('markus-session', null);
  if (!session) {
    prompt.classList.remove('hidden');
    dashboard.classList.add('hidden');
    logoutButton.classList.add('hidden');
    accountHeading.textContent = 'Your dashboard';
    return;
  }

  prompt.classList.add('hidden');
  dashboard.classList.remove('hidden');
  logoutButton.classList.remove('hidden');
  accountHeading.textContent = `${session.name}'s dashboard`;
  accountName.textContent = session.name;

  const projects = readStorage('markus-projects', []).filter((project) => project.ownerId === session.id);
  accountProjects.innerHTML = projects.length
    ? projects.map((project) => `
        <div class="project-card">
          <h3>${project.title}</h3>
          <p>${project.description}</p>
          <p class="muted">${project.file ? `File: ${project.file.name}` : 'No file uploaded'}</p>
          <div class="hero-actions">
            <button class="btn btn-secondary" data-action="delete-account-project" data-id="${project.id}">Remove</button>
          </div>
        </div>
      `).join('')
    : '<p class="muted">You have not uploaded any projects yet.</p>';
}

function renderAdmin() {
  const projectContainer = document.getElementById('admin-projects');
  const userContainer = document.getElementById('admin-users');
  if (!projectContainer || !userContainer) return;

  const projects = readStorage('markus-projects', []);
  const users = readStorage('markus-users', []);

  projectContainer.innerHTML = projects.map((project) => `
    <div class="project-card">
      <h3>${project.title}</h3>
      <form class="stacked-form" data-project-form="${project.id}">
        <input name="title" value="${project.title}" />
        <select name="type">
          <option value="game" ${project.type === 'game' ? 'selected' : ''}>Game</option>
          <option value="animation" ${project.type === 'animation' ? 'selected' : ''}>Animation</option>
          <option value="mc-plugin" ${project.type === 'mc-plugin' ? 'selected' : ''}>Minecraft plugin</option>
        </select>
        <textarea name="description" rows="3">${project.description}</textarea>
        <input name="link" value="${project.link || ''}" />
        <p class="muted">${project.file ? `Current file: ${project.file.name}` : 'No file uploaded'}</p>
        <div class="hero-actions">
          <button class="btn btn-primary" type="submit">Save</button>
          <button class="btn btn-secondary" type="button" data-action="delete-project" data-id="${project.id}">Delete</button>
        </div>
      </form>
    </div>
  `).join('');

  userContainer.innerHTML = users.map((user) => `
    <div class="project-card">
      <form class="stacked-form" data-user-form="${user.id}">
        <input name="name" value="${user.name}" />
        <input name="email" value="${user.email}" />
        <select name="role">
          <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
          <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
        <div class="hero-actions">
          <button class="btn btn-primary" type="submit">Save</button>
          <button class="btn btn-secondary" type="button" data-action="delete-user" data-id="${user.id}">Remove</button>
        </div>
      </form>
    </div>
  `).join('');
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function handleUpload(event) {
  event.preventDefault();
  const title = document.getElementById('title').value.trim();
  const type = document.getElementById('type').value;
  const description = document.getElementById('description').value.trim();
  const link = document.getElementById('link').value.trim();
  const fileInput = document.getElementById('upload-file');
  const projects = readStorage('markus-projects', []);
  const session = readStorage('markus-session', null);

  if (!session) {
    document.getElementById('upload-status').textContent = 'Please sign in before uploading.';
    return;
  }

  let fileData = null;
  if (fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    fileData = {
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl: await readFileAsDataUrl(file)
    };
  }

  projects.unshift({ id: Date.now(), title, type, description, file: fileData, link, ownerId: session.id });
  writeStorage('markus-projects', projects);

  document.getElementById('upload-status').textContent = 'Project uploaded successfully.';
  event.target.reset();
  renderProjects();
  renderAccountDashboard();
}

async function handleAccountUpload(event) {
  event.preventDefault();
  const title = document.getElementById('account-title').value.trim();
  const type = document.getElementById('account-type').value;
  const description = document.getElementById('account-description').value.trim();
  const link = document.getElementById('account-link').value.trim();
  const fileInput = document.getElementById('account-upload-file');
  const projects = readStorage('markus-projects', []);
  const session = readStorage('markus-session', null);

  if (!session) {
    document.getElementById('account-upload-status').textContent = 'Please sign in before uploading.';
    return;
  }

  let fileData = null;
  if (fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    fileData = {
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl: await readFileAsDataUrl(file)
    };
  }

  projects.unshift({ id: Date.now(), title, type, description, file: fileData, link, ownerId: session.id });
  writeStorage('markus-projects', projects);

  document.getElementById('account-upload-status').textContent = 'Project uploaded successfully.';
  event.target.reset();
  renderProjects();
  renderAccountDashboard();
}

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const status = document.getElementById('login-status');

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      status.textContent = result.message || 'Invalid credentials.';
      return;
    }

    writeStorage('markus-session', { id: result.user.id, name: result.user.name, role: result.user.role, token: result.token });
    status.textContent = `Welcome back, ${result.user.name}!`;
    window.location.href = 'account.html';
  } catch (error) {
    status.textContent = 'Unable to reach the server.';
  }
}

async function handleSignup(event) {
  event.preventDefault();
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value.trim();
  const status = document.getElementById('signup-status');

  try {
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const result = await response.json();

    if (!response.ok && !result.success) {
      status.textContent = result.message || 'Signup failed.';
      return;
    }

    status.textContent = result.message || 'Account created successfully!';
    event.target.reset();
  } catch (error) {
    status.textContent = 'Unable to reach the server.';
  }
}

async function handleAdminLogin(event) {
  event.preventDefault();
  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value.trim();
  const dashboard = document.getElementById('admin-dashboard');
  const status = document.getElementById('admin-status');

  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      dashboard.classList.add('hidden');
      status.textContent = result.message || 'Admin credentials invalid.';
      return;
    }

    writeStorage('markus-session', { id: result.user.id, name: result.user.name, role: result.user.role, token: result.token });
    dashboard.classList.remove('hidden');
    status.textContent = 'Admin access granted.';
    renderAdmin();
  } catch (error) {
    dashboard.classList.add('hidden');
    status.textContent = 'Unable to reach the server.';
  }
}

function saveProject(event) {
  event.preventDefault();
  const form = event.target;
  const id = Number(form.dataset.projectForm);
  const projects = readStorage('markus-projects', []);
  const index = projects.findIndex((project) => project.id === id);

  if (index >= 0) {
    projects[index] = {
      ...projects[index],
      title: form.title.value.trim(),
      type: form.type.value,
      description: form.description.value.trim(),
      link: form.link.value.trim()
    };
    writeStorage('markus-projects', projects);
    renderAdmin();
    renderProjects();
  }
}

function saveUser(event) {
  event.preventDefault();
  const form = event.target;
  const id = Number(form.dataset.userForm);
  const users = readStorage('markus-users', []);
  const index = users.findIndex((user) => user.id === id);

  if (index >= 0) {
    users[index] = {
      ...users[index],
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      role: form.role.value
    };
    writeStorage('markus-users', users);
    renderAdmin();
  }
}

function deleteProject(id) {
  const projects = readStorage('markus-projects', []);
  const updated = projects.filter((project) => project.id !== Number(id));
  writeStorage('markus-projects', updated);
  renderAdmin();
  renderProjects();
  renderAccountDashboard();
}

function deleteAccountProject(id) {
  const projects = readStorage('markus-projects', []);
  const updated = projects.filter((project) => project.id !== Number(id));
  writeStorage('markus-projects', updated);
  renderProjects();
  renderAccountDashboard();
}

function deleteUser(id) {
  const users = readStorage('markus-users', []);
  const updated = users.filter((user) => user.id !== Number(id));
  writeStorage('markus-users', updated);
  renderAdmin();
}

document.addEventListener('DOMContentLoaded', () => {
  initDefaults();
  renderNavigation();
  renderProjects();
  renderAccountDashboard();

  document.getElementById('upload-form')?.addEventListener('submit', handleUpload);
  document.getElementById('account-upload-form')?.addEventListener('submit', handleAccountUpload);
  document.getElementById('login-form')?.addEventListener('submit', handleLogin);
  document.getElementById('signup-form')?.addEventListener('submit', handleSignup);
  document.getElementById('admin-login-form')?.addEventListener('submit', handleAdminLogin);
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('markus-session');
    renderNavigation();
    renderAccountDashboard();
  });

  document.addEventListener('click', (event) => {
    const deleteProjectBtn = event.target.closest('[data-action="delete-project"]');
    if (deleteProjectBtn) {
      deleteProject(deleteProjectBtn.dataset.id);
    }

    const deleteUserBtn = event.target.closest('[data-action="delete-user"]');
    if (deleteUserBtn) {
      deleteUser(deleteUserBtn.dataset.id);
    }

    const deleteAccountProjectBtn = event.target.closest('[data-action="delete-account-project"]');
    if (deleteAccountProjectBtn) {
      deleteAccountProject(deleteAccountProjectBtn.dataset.id);
    }
  });

  document.addEventListener('submit', (event) => {
    if (event.target.matches('[data-project-form]')) {
      saveProject(event);
    }
    if (event.target.matches('[data-user-form]')) {
      saveUser(event);
    }
  });

});
