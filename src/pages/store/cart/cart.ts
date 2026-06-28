import type { CartItem } from "../../../types/product";
import { CartService } from "../../../utils/localStorage";


class StoreCart {
    private cartItems: CartItem[] = [];
    
    constructor() {
        this.init();
    }
    
    private init(): void {
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
        const total = CartService.getTotal();
        const totalElement = document.getElementById('cart-total');
        const totalItemsElement = document.getElementById('total-items');
        
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
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new StoreCart();
});
