// Frontend-only storage service - replaces all backend API calls
// Uses localStorage for all data persistence

const KEYS = {
  USERS: 'slideup_users',
  CURRENT_USER: 'slideup_current_user',
  PRESENTATIONS: 'slideup_presentations',
  VERSIONS: 'slideup_versions',
};

// ==================== HELPERS ====================

function getStore<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setStore<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ==================== USER / AUTH ====================

export interface StoredUser {
  id: number;
  username: string;
  password: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface StoredCurrentUser {
  id: number;
  username: string;
  role: 'user' | 'admin';
}

function getUsers(): StoredUser[] {
  return getStore<StoredUser[]>(KEYS.USERS, []);
}

function saveUsers(users: StoredUser[]) {
  setStore(KEYS.USERS, users);
}

export function getAllUsers(): StoredUser[] {
  return getUsers();
}

export function loginUser(username: string, password: string): { user: StoredCurrentUser; token: string } | { error: string } {
  const users = getUsers();
  const existing = users.find(u => u.username === username);

  if (existing) {
    if (existing.password !== password) {
      return { error: 'كلمة المرور غير صحيحة' };
    }
    const currentUser: StoredCurrentUser = { id: existing.id, username: existing.username, role: existing.role };
    const token = btoa(JSON.stringify({ id: existing.id, username: existing.username, role: existing.role, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
    setStore(KEYS.CURRENT_USER, { ...currentUser, token });
    return { user: currentUser, token };
  }

  // Auto-register new user
  const newUser: StoredUser = {
    id: Date.now(),
    username,
    password,
    role: 'user',
    createdAt: new Date().toISOString(),
  };
  const updatedUsers = [...users, newUser];
  saveUsers(updatedUsers);

  const currentUser: StoredCurrentUser = { id: newUser.id, username: newUser.username, role: newUser.role };
  const token = btoa(JSON.stringify({ id: newUser.id, username: newUser.username, role: newUser.role, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
  setStore(KEYS.CURRENT_USER, { ...currentUser, token });
  return { user: currentUser, token };
}

export function getCurrentUser(): StoredCurrentUser | null {
  const data = getStore<{ id: number; username: string; role: string; token: string } | null>(KEYS.CURRENT_USER, null);
  if (!data) return null;
  return { id: data.id, username: data.username, role: data.role as 'user' | 'admin' };
}

export function getToken(): string | null {
  const data = getStore<{ token?: string } | null>(KEYS.CURRENT_USER, null);
  return data?.token || null;
}

export function logoutUser() {
  localStorage.removeItem(KEYS.CURRENT_USER);
}

// ==================== PRESENTATIONS ====================

export interface StoredPresentation {
  id: string;
  userId: number;
  title: string;
  slideCount: number;
  data: string;
  createdAt: string;
  updatedAt: string;
}

function getPresentationsStore(): StoredPresentation[] {
  return getStore<StoredPresentation[]>(KEYS.PRESENTATIONS, []);
}

function savePresentationsStore(presentations: StoredPresentation[]) {
  setStore(KEYS.PRESENTATIONS, presentations);
}

export function getPresentationsByUser(userId: number): StoredPresentation[] {
  return getPresentationsStore()
    .filter(p => p.userId === userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getPresentationById(id: string, userId: number): StoredPresentation | undefined {
  return getPresentationsStore().find(p => p.id === id && p.userId === userId);
}

export function savePresentation(presentation: Omit<StoredPresentation, 'createdAt' | 'updatedAt'>): { success: boolean; id: string } {
  const all = getPresentationsStore();
  const existing = all.findIndex(p => p.id === presentation.id && p.userId === presentation.userId);

  if (existing >= 0) {
    all[existing] = {
      ...all[existing],
      title: presentation.title,
      slideCount: presentation.slideCount,
      data: presentation.data,
      updatedAt: new Date().toISOString(),
    };
  } else {
    all.push({
      ...presentation,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  savePresentationsStore(all);
  return { success: true, id: presentation.id };
}

export function deletePresentation(id: string, userId: number): boolean {
  const all = getPresentationsStore();
  const filtered = all.filter(p => !(p.id === id && p.userId === userId));
  if (filtered.length === all.length) return false;
  savePresentationsStore(filtered);
  return true;
}

export function duplicatePresentation(id: string, userId: number): { success: boolean; newId?: string } {
  const all = getPresentationsStore();
  const original = all.find(p => p.id === id && p.userId === userId);
  if (!original) return { success: false };

  const newId = `pres-${Date.now()}`;
  const duplicate: StoredPresentation = {
    ...original,
    id: newId,
    title: `${original.title} (نسخة)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  all.push(duplicate);
  savePresentationsStore(all);
  return { success: true, newId };
}

// ==================== VERSION HISTORY ====================

export interface StoredVersion {
  id: string;
  presentationId: string;
  userId: number;
  versionNumber: number;
  title: string;
  slideCount: number;
  data: string;
  changeSummary: string;
  createdAt: string;
}

export function getVersions(presentationId: string, userId: number): StoredVersion[] {
  const all = getStore<StoredVersion[]>(KEYS.VERSIONS, []);
  return all
    .filter(v => v.presentationId === presentationId && v.userId === userId)
    .sort((a, b) => b.versionNumber - a.versionNumber);
}

export function createVersion(presentationId: string, userId: number, title: string, slideCount: number, data: string, changeSummary: string): StoredVersion {
  const all = getStore<StoredVersion[]>(KEYS.VERSIONS, []);
  const existing = all.filter(v => v.presentationId === presentationId);
  const versionNumber = existing.length > 0 ? Math.max(...existing.map(v => v.versionNumber)) + 1 : 1;

  const version: StoredVersion = {
    id: generateId(),
    presentationId,
    userId,
    versionNumber,
    title,
    slideCount,
    data,
    changeSummary,
    createdAt: new Date().toISOString(),
  };

  all.push(version);
  setStore(KEYS.VERSIONS, all);
  return version;
}

export function restoreVersion(presentationId: string, versionId: string, userId: number): { success: boolean; data?: any } {
  const all = getStore<StoredVersion[]>(KEYS.VERSIONS, []);
  const version = all.find(v => v.id === versionId && v.presentationId === presentationId && v.userId === userId);
  if (!version) return { success: false };

  return { success: true, data: { title: version.title, slideCount: version.slideCount, data: version.data } };
}

// ==================== LIMITS ====================

export function getLimits() {
  return {
    limits: {
      maxSlides: 100,
      maxElements: 50,
      maxPresentations: 50,
      maxExportsPerDay: 10,
      canExportPptx: true,
      canExportPdf: true,
      canExportImages: true,
    }
  };
}
