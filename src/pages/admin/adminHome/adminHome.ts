import { requireAdmin, destroySession } from '../../../utils/auth';
import { AdminStore } from '../../../utils/admin-store';

class AdminDashboard {
    private categoryStore = new AdminStore<any>();
    private productStore = new AdminStore<any>();
    private orderStore = new AdminStore<any>();
    private userStore = new AdminStore<any>();

    constructor() {
        this.init();
    }

    private async init(): Promise<void> {
        requireAdmin();

        await Promise.all([
            this.categoryStore.loadFromJSON('/data/categorias.json'),
            this.productStore.loadFromJSON('/data/productos.json'),
            this.orderStore.loadFromJSON('/data/pedidos.json'),
            this.userStore.loadFromJSON('/data/usuarios.json'),
        ]);

        this.renderStats();
        this.renderSummaries();
        this.setupEventListeners();
    }

    private renderStats(): void {
        const categories = this.categoryStore.getAll();
        const products = this.productStore.getAll();
        const orders = this.orderStore.getAll();
        const users = this.userStore.getAll();
        const availableProducts = products.filter((p: any) => p.disponible && p.stock > 0);

        this.setText('stat-categories', categories.length);
        this.setText('stat-products', products.length);
        this.setText('stat-orders', orders.length);
        this.setText('stat-available', availableProducts.length);
        this.setText('stat-users', users.length);
    }

    private renderSummaries(): void {
        const categories = this.categoryStore.getAll();
        const products = this.productStore.getAll();
        const orders = this.orderStore.getAll();

        // Categories: active vs inactive
        const catActivas = categories.filter((c: any) => !c.eliminado).length;
        const catInactivas = categories.filter((c: any) => c.eliminado).length;
        this.setText('cat-activas', catActivas);
        this.setText('cat-inactivas', catInactivas);

        // Products: available vs not
        const prodDisponibles = products.filter((p: any) => p.disponible).length;
        const prodNoDisponibles = products.filter((p: any) => !p.disponible).length;
        this.setText('prod-disponibles', prodDisponibles);
        this.setText('prod-no-disponibles', prodNoDisponibles);

        // Orders by status
        const estados = ['PENDIENTE', 'CONFIRMADO', 'TERMINADO', 'CANCELADO'];
        const ids = ['order-pendientes', 'order-confirmados', 'order-terminados', 'order-cancelados'];
        estados.forEach((estado, i) => {
            const count = orders.filter((o: any) => o.estado === estado).length;
            this.setText(ids[i], count);
        });
    }

    private setText(id: string, value: number): void {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value.toString();
        }
    }

    private setupEventListeners(): void {
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                destroySession();
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboard();
});
