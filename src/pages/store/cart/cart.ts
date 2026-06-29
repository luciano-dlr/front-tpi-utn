import type { CartItem } from "../../../types/product";
import type { Order, OrderItem, FormaPago } from "../../../types/order";
import { CartService } from "../../../utils/localStorage";
import { requireAuth, currentUser, destroySession } from "../../../utils/auth";

const ENVIO = 0;

class StoreCart {
    private cartItems: CartItem[] = [];
    
    constructor() {
        this.init();
    }
    
    private init(): void {
        requireAuth();
        this.loadCart();
        this.setupEventListeners();
    }
    
    private loadCart(): void {
        this.cartItems = CartService.getCart();
        this.renderCart();
        this.updateTotal();
    }
    
    private renderCart(): void {
        const container = document.getElementById('cart-items-container');
        const emptyCartMessage = document.getElementById('empty-cart-message');
        const cartContent = document.getElementById('cart-content');
        
        if (!container || !emptyCartMessage || !cartContent) return;
        
        if (this.cartItems.length === 0) {
            emptyCartMessage.style.display = 'block';
            cartContent.style.display = 'none';
            return;
        }
        
        emptyCartMessage.style.display = 'none';
        cartContent.style.display = 'block';
        
        container.innerHTML = '';
        
        this.cartItems.forEach(item => {
            const cartItemElement = this.createCartItemElement(item);
            container.appendChild(cartItemElement);
        });
    }
    
    private createCartItemElement(item: CartItem): HTMLElement {
        const subtotal = item.product.precio * item.quantity;
        const maxStock = item.product.stock;
        const atMaxStock = item.quantity >= maxStock;
        
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-info">
                <h3>${item.product.nombre}</h3>
                <p class="cart-item-price">$${item.product.precio.toLocaleString()} c/u</p>
                <p class="cart-item-stock">Stock disponible: ${CartService.getAvailableStock(item.product)}</p>
            </div>
            <div class="cart-item-controls">
                <div class="quantity-controls">
                    <button class="quantity-btn decrease" data-id="${item.product.id}">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn increase" data-id="${item.product.id}" ${atMaxStock ? 'disabled' : ''}>+</button>
                </div>
                <span class="cart-item-subtotal">$${subtotal.toLocaleString()}</span>
                <button class="remove-btn" data-id="${item.product.id}">
                    <span class="remove-icon">X</span>
                </button>
            </div>
        `;
        
        const decreaseBtn = div.querySelector('.decrease');
        const increaseBtn = div.querySelector('.increase');
        const removeBtn = div.querySelector('.remove-btn');
        
        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', () => this.updateQuantity(item.product.id, item.quantity - 1));
        }
        
        if (increaseBtn) {
            increaseBtn.addEventListener('click', () => {
                if (item.quantity < maxStock) {
                    this.updateQuantity(item.product.id, item.quantity + 1);
                }
            });
        }
        
        if (removeBtn) {
            removeBtn.addEventListener('click', () => this.removeItem(item.product.id));
        }
        
        return div;
    }
    
    private updateQuantity(productId: number, newQuantity: number): void {
        CartService.updateQuantity(productId, newQuantity);
        this.loadCart();
    }
    
    private removeItem(productId: number): void {
        CartService.removeProduct(productId);
        this.loadCart();
    }
    
    private updateTotal(): void {
        const subtotal = this.cartItems.reduce((sum, item) => sum + item.product.precio * item.quantity, 0);
        const total = subtotal + ENVIO;
        const totalElement = document.getElementById('cart-total');
        const subtotalElement = document.getElementById('cart-subtotal');
        const envioElement = document.getElementById('cart-envio');
        const totalItemsElement = document.getElementById('total-items');
        
        if (subtotalElement) {
            subtotalElement.textContent = `$${subtotal.toLocaleString()}`;
        }
        
        if (envioElement) {
            envioElement.textContent = `$${ENVIO.toLocaleString()}`;
        }
        
        if (totalElement) {
            totalElement.textContent = `$${total.toLocaleString()}`;
        }
        
        if (totalItemsElement) {
            const totalItems = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
            totalItemsElement.textContent = totalItems.toString();
        }
    }
    
    private setupEventListeners(): void {
        const clearCartBtn = document.getElementById('clear-cart-btn');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => {
                if (confirm('¿Estás seguro de que querés vaciar el carrito?')) {
                    CartService.clearCart();
                    this.loadCart();
                }
            });
        }
        
        const continueShoppingBtn = document.getElementById('continue-shopping-btn');
        if (continueShoppingBtn) {
            continueShoppingBtn.addEventListener('click', () => {
                window.location.href = '../home/home.html';
            });
        }

        const confirmBtn = document.getElementById('btn-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.confirmOrder());
        }

        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                destroySession();
            });
        }
    }

    private confirmOrder(): void {
        const telefonoInput = document.getElementById('telefono') as HTMLInputElement;
        const formaPagoSelect = document.getElementById('forma-pago') as HTMLSelectElement;
        const errorDiv = document.getElementById('checkout-error');

        if (!errorDiv) return;

        const telefono = telefonoInput?.value.trim() || '';
        const formaPago = formaPagoSelect?.value as FormaPago | '';

        if (!telefono) {
            errorDiv.textContent = 'Por favor, ingresá tu teléfono';
            errorDiv.style.display = 'block';
            return;
        }

        if (!formaPago) {
            errorDiv.textContent = 'Por favor, seleccioná una forma de pago';
            errorDiv.style.display = 'block';
            return;
        }

        errorDiv.style.display = 'none';

        const user = currentUser();
        if (!user) {
            requireAuth();
            return;
        }

        const items = CartService.getCart();
        if (items.length === 0) return;

        const detalles: OrderItem[] = items.map(item => ({
            idProducto: item.product.id,
            nombre: item.product.nombre,
            cantidad: item.quantity,
            precio: item.product.precio,
            subtotal: item.product.precio * item.quantity,
        }));

        const subtotal = detalles.reduce((sum, p) => sum + p.subtotal, 0);

        const order: Order = {
            id: Date.now(),
            idUsuario: user.id,
            fecha: new Date().toISOString().split('T')[0],
            estado: 'PENDIENTE',
            total: subtotal + ENVIO,
            formaPago: formaPago as FormaPago,
            telefono,
            detalles,
        };

        CartService.saveOrder(order);
        CartService.clearCart();

        const successMsg = document.getElementById('success-message');
        if (successMsg) {
            successMsg.style.display = 'block';
        }

        this.renderCart();
        this.updateTotal();

        setTimeout(() => {
            window.location.href = '../../client/orders/orders.html';
        }, 2000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new StoreCart();
});
