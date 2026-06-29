export interface User {
    id: number;
    nombre: string;
    apellido: string;
    mail: string;
    password?: string;  // only used during login, never stored in session
    celular: string;
    rol: 'ADMIN' | 'USUARIO';
    eliminado: boolean;
    createdAt: string;
}

export type Rol = 'ADMIN' | 'USUARIO';
