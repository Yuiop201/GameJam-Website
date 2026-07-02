const DEFAULT_ADMIN_EMAIL = 'ninjamaklol@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'Yuiop201';
const PROJECTS_STORAGE_KEY = 'markus-game-jams-projects';
const USERS_STORAGE_KEY = 'markus-game-jams-users';
const ADMIN_STORAGE_KEY = 'markus-game-jams-admin';

const starterProjects = [
  {
    id: 'demo-1',
    title: 'Pixel Platformer',
    description: 'A short game jam prototype with polished movement and a looping soundtrack.',
    category: 'game',
    demo_url: 'https://example.com',
    file_url: 'https://example.com/build.zip',
    approved: true
  },
  {
    id: 'demo-2',
    title: 'Moonlight Loop',
    description: 'A dreamy 15-second animation created for the theme of light and shadow.',
    category: 'animation',
    demo_url: '',
    file_url: '',
    approved: true
  }
];

const starterUsers = [
  { id: 'user-1', name: 'Alice', email: 'alice@example.com', role: 'user' },
  { id: 'admin-1', name: 'Admin', email: DEFAULT_ADMIN_EMAIL, role: 'admin' }
];

function safeStorage() {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage;
}

function readProjects() {
  const storage = safeStorage();
  if (!storage) {
    return starterProjects;
  }
  const value = storage.getItem(PROJECTS_STORAGE_KEY);
  if (!value) {
    storage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(starterProjects));
    return starterProjects;
  }
  try {
    return JSON.parse(value);
  } catch {
    return starterProjects;
  }
}

function writeProjects(projects) {
  const storage = safeStorage();
  if (storage) {
    storage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  }
}

function readUsers() {
  const storage = safeStorage();
  if (!storage) {
    return starterUsers;
  }
  const value = storage.getItem(USERS_STORAGE_KEY);
  if (!value) {
    storage.setItem(USERS_STORAGE_KEY, JSON.stringify(starterUsers));
    return starterUsers;
  }
  try {
    return JSON.parse(value);
  } catch {
    return starterUsers;
  }
}

function writeUsers(users) {
  const storage = safeStorage();
  if (storage) {
    storage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }
}

function readAdminState() {
  const storage = safeStorage();
  if (!storage) {
    return { authenticated: false, admin: null };
  }
  const value = storage.getItem(ADMIN_STORAGE_KEY);
  if (!value) {
    return { authenticated: false, admin: null };
  }
  try {
    return JSON.parse(value);
  } catch {
    return { authenticated: false, admin: null };
  }
}

function writeAdminState(state) {
  const storage = safeStorage();
  if (storage) {
    storage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(state));
  }
}

export async function listProjects() {
  return readProjects();
}

export async function createProject({ title, description, category, demo_url, file }) {
  const projects = readProjects();
  const project = {
    id: `project-${Date.now()}`,
    title,
    description,
    category,
    demo_url,
    file_url: file ? URL.createObjectURL(file) : '',
    approved: false
  };
  const nextProjects = [project, ...projects];
  writeProjects(nextProjects);
  return project;
}

export async function signInAdmin(email, password) {
  const valid = email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD;
  if (!valid) {
    return false;
  }

  const state = { authenticated: true, admin: { email } };
  writeAdminState(state);
  return true;
}

export async function getAdminState() {
  return readAdminState();
}

export async function updateProjectApproval(projectId, approved) {
  const projects = readProjects();
  const nextProjects = projects.map((project) => project.id === projectId ? { ...project, approved } : project);
  writeProjects(nextProjects);
  return nextProjects.find((project) => project.id === projectId);
}

export async function updateProjectCategory(projectId, category) {
  const projects = readProjects();
  const nextProjects = projects.map((project) => project.id === projectId ? { ...project, category } : project);
  writeProjects(nextProjects);
  return nextProjects.find((project) => project.id === projectId);
}

export async function removeProject(projectId) {
  const projects = readProjects();
  writeProjects(projects.filter((project) => project.id !== projectId));
  return true;
}

export async function setAdminPassword(password) {
  if (!password) {
    return false;
  }
  const state = readAdminState();
  writeAdminState({ ...state, admin: { ...(state.admin || {}), email: state.admin?.email || DEFAULT_ADMIN_EMAIL } });
  return true;
}

export async function signOutAdmin() {
  writeAdminState({ authenticated: false, admin: null });
  return true;
}

export async function listUsers() {
  return readUsers();
}

export async function updateUserRole(userId, role) {
  const users = readUsers();
  const nextUsers = users.map((user) => user.id === userId ? { ...user, role } : user);
  writeUsers(nextUsers);
  return nextUsers.find((user) => user.id === userId);
}
