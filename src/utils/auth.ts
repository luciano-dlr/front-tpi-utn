import type { User } from '../types/user';
import { fetchUsers } from './fetch';
import { navigate } from './navigate';

const SESSION_KEY = 'food_session';

export function getSession(): User | null {
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) return null;
    try {
        const parsed = JSON.parse(data);
        return parsed.user || null;
    } catch {
        return null;
    }
}

export function saveSession(user: User): void {
    // Strip password before saving
    const { password, ...safeUser } = user as any;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user: safeUser, loginAt: new Date().toISOString() }));
}

export function destroySession(): void {
    localStorage.removeItem(SESSION_KEY);
    navigate('../../auth/login/login.html');
}

export function isAuthenticated(): boolean {
    return getSession() !== null;
}

export function isAdmin(): boolean {
    const user = getSession();
    return user?.rol === 'ADMIN';
}

export function requireAuth(): void {
    if (!isAuthenticated()) {
        navigate('../../auth/login/login.html');
    }
}

export function requireAdmin(): void {
    requireAuth();
    if (!isAdmin()) {
        navigate('../../store/home/home.html');
    }
}

export function currentUser(): User | null {
    return getSession();
}

export async function login(email: string, password: string): Promise<User | null> {
    const users = await fetchUsers();
    const user = users.find((u: any) => u.mail === email && u.password === password);
    if (!user) return null;
    saveSession(user as User);
    return user as User;
}

export async function registerUser(data: { nombre: string; apellido: string; mail: string; celular: string; password: string }): Promise<User> {
    const users = await fetchUsers();
    const exists = users.some((u: any) => u.mail === data.mail);
    if (exists) throw new Error('El mail ya está registrado');

    const newUser: User = {
        id: Date.now(),
        nombre: data.nombre,
        apellido: data.apellido,
        mail: data.mail,
        celular: data.celular,
        rol: 'USUARIO',
        eliminado: false,
        createdAt: new Date().toISOString()
    };

    saveSession(newUser);
    return newUser;
}
