import { requireAuth, currentUser, destroySession } from '../../../utils/auth';
import { fetchOrders } from '../../../utils/fetch';
import { CartService } from '../../../utils/localStorage';
import type { Order } from '../../../types/order';

class ClientOrders {
    private orders: Order[] = [];

    constructor() {
        this.init();
    }

    private async init(): Promise<void> {
        requireAuth();

        const user = currentUser();
        if (!user) return;

        const seedOrders = await fetchOrders() as Order[];
        const localOrders = CartService.getOrders();

        this.orders = [...seedOrders, ...localOrders]
            .filter(o => o.idUsuario === user.id)
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        this.renderCards();
        this.setupEventListeners();
    }

    private getStatusClass(estado: string): string {
        const map: Record<string, string> = {
            PENDIENTE: 'status-pendiente',
            CONFIRMADO: 'status-confirmado',
            TERMINADO: 'status-terminado',
            CANCELADO: 'status-cancelado',
        };
        return map[estado] || '';
    }

    private renderCards(): void {
        const container = document.getElementById('orders-container');
        const emptyState = document.getElementById('empty-state');
        if (!container || !emptyState) return;

        if (this.orders.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        container.innerHTML = '';

        this.orders.forEach(order => {
            const statusClass = this.getStatusClass(order.estado);
            const productNames = order.detalles.slice(0, 3).map(p => p.nombre);
            const remaining = order.detalles.length - 3;
            let productsHtml = productNames.join(', ');
            if (remaining > 0) {
                productsHtml += ` y ${remaining} más`;
            }

            const card = document.createElement('div');
            card.className = 'client-order-card';
            card.dataset.id = order.id.toString();
            card.innerHTML = `
                <div class="client-order-card-header">
                    <span class="client-order-card-number">Pedido #${order.id}</span>
                    <span class="status-badge ${statusClass}">${order.estado}</span>
                </div>
                <div class="client-order-card-body">
                    <div class="client-order-card-info">
                        <span class="client-order-card-label">Fecha</span>
                        <span class="client-order-card-value">${order.fecha}</span>
                    </div>
                    <div class="client-order-card-info">
                        <span class="client-order-card-label">Productos</span>
                        <span class="client-order-card-value">${productsHtml}</span>
                    </div>
                    <div class="client-order-card-info">
                        <span class="client-order-card-label">Total</span>
                        <span class="client-order-card-value client-order-card-total">$${order.total.toFixed(2)}</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    private renderDetailModal(orderId: number): void {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        document.getElementById('order-number')!.textContent = order.id.toString();
        document.getElementById('order-date')!.textContent = order.fecha;

        const statusBadge = document.getElementById('order-status-badge')!;
        statusBadge.textContent = order.estado;
        statusBadge.className = `status-badge ${this.getStatusClass(order.estado)}`;

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

        // Cost breakdown
        const subtotal = order.detalles.reduce((s, i) => s + i.subtotal, 0);
        const shipping = order.total - subtotal;

        document.getElementById('order-subtotal')!.textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('order-shipping')!.textContent = shipping > 0 ? `$${shipping.toFixed(2)}` : 'Gratis';
        document.getElementById('order-total')!.textContent = `$${order.total.toFixed(2)}`;

        this.showModal();
    }

    private setupEventListeners(): void {
        // Card click — open detail modal
        const container = document.getElementById('orders-container');
        if (container) {
            container.addEventListener('click', (e: MouseEvent) => {
                const card = (e.target as HTMLElement).closest('.client-order-card') as HTMLElement;
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
    }

    private showModal(): void {
        document.getElementById('order-modal')?.classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ClientOrders();
});
