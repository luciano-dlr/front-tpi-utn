import { fetchJSON } from './fetch';

type WithId = { id: number };

export class AdminStore<T extends WithId> {
    private items: T[] = [];

    async loadFromJSON(url: string): Promise<void> {
        const data = await fetchJSON<T[]>(url);
        this.items = data;
    }

    getAll(): T[] {
        return this.items.filter(item => !(item as any).eliminado);
    }

    getById(id: number): T | null {
        return this.items.find(item => item.id === id) ?? null;
    }

    create(item: Omit<T, 'id'>): T {
        const newItem = { ...item, id: Date.now() } as unknown as T;
        this.items.push(newItem);
        return newItem;
    }

    update(id: number, partial: Partial<T>): T | null {
        const index = this.items.findIndex(item => item.id === id);
        if (index === -1) return null;
        this.items[index] = { ...this.items[index], ...partial };
        return this.items[index];
    }

    delete(id: number): boolean {
        const item = this.items.find(item => item.id === id);
        if (!item) return false;
        (item as any).eliminado = true;
        return true;
    }
}
