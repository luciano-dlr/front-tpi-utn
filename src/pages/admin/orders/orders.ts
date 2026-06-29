import { requireAdmin, destroySession } from '../../../utils/auth';
import { AdminStore } from '../../../utils/admin-store';
import type { Order, Estado } from '../../../types/order';
import type { User } from '../../../types/user';

class AdminOrders {
    private orderStore = new AdminStore<Order>();
    private userStore = new AdminStore<User>();
    private currentFilter: string = 'all';
    private currentOrders: Order[] = [];
    private viewingOrderId: number | null = null;

    constructor() {
        this.init();
    }

    private async init(): Promise<void> {
        requireAdmin();
        await Promise.all([
            this.orderStore.loadFromJSON('/data/pedidos.json'),
            this.userStore.loadFromJSON('/data/usuarios.json'),
        ]);
        this.currentOrders = this.getSortedOrders();
        this.renderCards();
        this.setupEventListeners();
    }

    private getSortedOrders(): Order[] {
        return this.orderStore.getAll().sort((a, b) => {
            return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        });
    }

    private getClientName(idUsuario: number): string {
        const user = this.userStore.getById(idUsuario);
        if (!user) return 'Cliente desconocido';
        return `${user.nombre} ${user.apellido}`;
    }

    private renderCards(): void {
        const container = document.getElementById('orders-container');
        const emptyState = document.getElementById('empty-state');
        if (!container || !emptyState) return;

        const filtered = this.currentFilter === 'all'
            ? this.currentOrders
            : this.currentOrders.filter(o => o.estado === this.currentFilter);

        if (filtered.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        container.innerHTML = '';

        filtered.forEach(order => {
            const statusClass = order.estado.toLowerCase();
            const itemCount = order.detalles.reduce((sum, item) => sum + item.cantidad, 0);
            const card = document.createElement('div');
            card.className = 'order-card';
            card.dataset.id = order.id.toString();
            card.innerHTML = `
                <div class="order-card-header">
                    <span class="order-card-number">Pedido #${order.id}</span>
                    <span class="status-badge ${statusClass}">${order.estado}</span>
                </div>
                <div class="order-card-body">
                    <div class="order-card-info">
                        <span class="order-card-label">Cliente</span>
                        <span class="order-card-value">${this.getClientName(order.idUsuario)}</span>
                    </div>
                    <div class="order-card-info">
                        <span class="order-card-label">Fecha</span>
                        <span class="order-card-value">${order.fecha}</span>
                    </div>
                    <div class="order-card-info">
                        <span class="order-card-label">Productos</span>
                        <span class="order-card-value">${itemCount} unidades</span>
                    </div>
                    <div class="order-card-info">
                        <span class="order-card-label">Total</span>
                        <span class="order-card-value order-card-total">$${order.total.toFixed(2)}</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    private renderDetailModal(orderId: number): void {
        const order = this.orderStore.getById(orderId);
        if (!order) return;

        this.viewingOrderId = orderId;

        document.getElementById('order-number')!.textContent = order.id.toString();
        document.getElementById('order-client')!.textContent = this.getClientName(order.idUsuario);
        document.getElementById('order-date')!.textContent = order.fecha;

        const statusBadge = document.getElementById('order-status-badge')!;
        statusBadge.textContent = order.estado;
        statusBadge.className = `status-badge ${order.estado.toLowerCase()}`;

        const paymentLabels: Record<string, string> = {
            TARJETA: 'Tarjeta',
            TRANSFERENCIA: 'Transferencia',
            EFECTIVO: 'Efectivo',
        };
        document.getElementById('order-payment')!.textContent = paymentLabels[order.formaPago] || order.formaPago;
        document.getElementById('order-phone')!.textContent = order.telefono || '-';

        // Items table
        const tbody = document.getElementById('order-items-tbody')!;
        tbody.innerHTML = '';
        order.detalles.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.nombre}</td>
                <td>${item.cantidad}</td>
                <td>$${item.precio.toFixed(2)}</td>
                <td>$${item.subtotal.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });

        // Computed fields
        const subtotal = order.detalles.reduce((s, i) => s + i.subtotal, 0);
        const shipping = order.total - subtotal;

        document.getElementById('order-subtotal')!.textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('order-shipping')!.textContent = shipping > 0 ? `$${shipping.toFixed(2)}` : 'Gratis';
        document.getElementById('order-total')!.textContent = `$${order.total.toFixed(2)}`;

        // Status change select
        const statusSelect = document.getElementById('input-change-status') as HTMLSelectElement;
        statusSelect.value = order.estado;

        this.showModal();
    }

    private setupEventListeners(): void {
        // Filter buttons
        const filterContainer = document.getElementById('orders-filter');
        if (filterContainer) {
            filterContainer.addEventListener('click', (e: MouseEvent) => {
                const btn = (e.target as HTMLElement).closest('.filter-btn') as HTMLButtonElement;
                if (!btn) return;

                // Update active state
                filterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active-filter'));
                btn.classList.add('active-filter');

                this.currentFilter = btn.dataset.filter || 'all';
                this.renderCards();
            });
        }

        // Card click - open detail modal
        const container = document.getElementById('orders-container');
        if (container) {
            container.addEventListener('click', (e: MouseEvent) => {
                const card = (e.target as HTMLElement).closest('.order-card') as HTMLElement;
                if (!card) return;
                const id = Number(card.dataset.id);
                this.renderDetailModal(id);
            });
        }

        // Close modal
        const closeBtn = document.getElementById('btn-close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        const overlay = document.getElementById('order-modal');
        if (overlay) {
            overlay.addEventListener('click', (e: MouseEvent) => {
                if (e.target === overlay) this.closeModal();
            });
        }

        // Status change in modal
        const statusSelect = document.getElementById('input-change-status') as HTMLSelectElement;
        if (statusSelect) {
            statusSelect.addEventListener('change', () => {
                if (this.viewingOrderId === null) return;
                const newStatus = statusSelect.value as Estado;
                this.orderStore.update(this.viewingOrderId, { estado: newStatus } as Partial<Order>);
                // Update the modal badge
                const badge = document.getElementById('order-status-badge')!;
                badge.textContent = newStatus;
                badge.className = `status-badge ${newStatus.toLowerCase()}`;
                // Reload sorted orders and re-render cards
                this.currentOrders = this.getSortedOrders();
                this.renderCards();
            });
        }

        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                destroySession();
            });
        }
    }

    private closeModal(): void {
        document.getElementById('order-modal')?.classList.remove('active');
        this.viewingOrderId = null;
    }

    private showModal(): void {
        document.getElementById('order-modal')?.classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AdminOrders();
});
