const DATA_PATH = '/data/';

export async function fetchJSON<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
}

export async function fetchProducts(): Promise<any[]> {
    try {
        return await fetchJSON<any[]>(`${DATA_PATH}productos.json`);
    } catch (err) {
        console.warn('fetchProducts failed:', err);
        return [];
    }
}

export async function fetchCategories(): Promise<any[]> {
    try {
        return await fetchJSON<any[]>(`${DATA_PATH}categorias.json`);
    } catch (err) {
        console.warn('fetchCategories failed:', err);
        return [];
    }
}

export async function fetchUsers(): Promise<any[]> {
    try {
        return await fetchJSON<any[]>(`${DATA_PATH}usuarios.json`);
    } catch (err) {
        console.warn('fetchUsers failed:', err);
        return [];
    }
}

export async function fetchOrders(): Promise<any[]> {
    try {
        return await fetchJSON<any[]>(`${DATA_PATH}pedidos.json`);
    } catch (err) {
        console.warn('fetchOrders failed:', err);
        return [];
    }
}
