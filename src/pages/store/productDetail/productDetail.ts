import { fetchProducts } from '../../../utils/fetch';
import { requireAuth, destroySession } from '../../../utils/auth';
import { CartService } from '../../../utils/localStorage';
import type { Product } from '../../../types/product';

class ProductDetail {
    private productId: number | null = null;
    private product: Product | null = null;

    constructor() {
        this.init();
    }

    private async init(): Promise<void> {
        requireAuth();

        const params = new URLSearchParams(window.location.search);
        const idParam = params.get('id');

        if (!idParam) {
            this.showNotFound();
            return;
        }

        this.productId = parseInt(idParam, 10);
        if (isNaN(this.productId)) {
            this.showNotFound();
            return;
        }

        const products = await fetchProducts();
        const found = products.find((p: any) => p.id === this.productId);
        this.product = found ? (found as Product) : null;

        if (!this.product) {
            this.showNotFound();
            return;
        }

        this.render();
        this.updateCartCount();
    }

    private showNotFound(): void {
        const container = document.getElementById('product-detail-container');
        if (!container) return;
        container.innerHTML = `
            <div class="not-found">
                <h2>Producto no encontrado</h2>
                <p>El producto que buscás no existe o ha sido eliminado.</p>
                <a href="../home/home.html" class="btn-primary">Volver al catálogo</a>
            </div>
        `;
    }

    private render(): void {
        const container = document.getElementById('product-detail-container');
        if (!container || !this.product) return;

        const product = this.product;
        const availableStock = CartService.getAvailableStock(product);
        const outOfStock = !product.disponible || availableStock <= 0;

        container.innerHTML = `
            <div class="product-detail">
                <div class="product-detail-image">
                    <img src="${product.imagen}" alt="${product.nombre}" onerror="this.onerror=null; this.src='https://placehold.co/400x400?text=${product.nombre}'">
                </div>
                <div class="product-detail-info">
                    <h2>${product.nombre}</h2>
                    <p class="product-description">${product.descripcion}</p>
                    <strong class="product-price">$${product.precio.toLocaleString()}</strong>
                    <p class="product-stock">Stock disponible: ${availableStock}</p>
                    ${outOfStock ? '<span class="out-of-stock">Sin stock</span>' : ''}
                    ${!outOfStock ? `
                        <div class="quantity-selector">
                            <button id="qty-decrease" class="quantity-btn" disabled>-</button>
                            <span id="qty-value" class="quantity">1</span>
                            <button id="qty-increase" class="quantity-btn">+</button>
                        </div>
                        <button id="add-to-cart-btn" class="btn-agregar">Agregar al carrito</button>
                        <div id="add-success" class="success-message" style="display: none;">
                            ¡Producto agregado al carrito!
                        </div>
                    ` : ''}
                    <a href="../home/home.html" class="back-link">← Volver al catálogo</a>
                </div>
            </div>
        `;

        if (!outOfStock) {
            this.setupQuantityControls(availableStock);
            this.setupAddToCart();
        }

        this.setupLogout();
    }

    private setupQuantityControls(maxStock: number): void {
        const decreaseBtn = document.getElementById('qty-decrease');
        const increaseBtn = document.getElementById('qty-increase');
        const qtySpan = document.getElementById('qty-value');

        let quantity = 1;

        if (decreaseBtn && increaseBtn && qtySpan) {
            const updateButtons = () => {
                (decreaseBtn as HTMLButtonElement).disabled = quantity <= 1;
                (increaseBtn as HTMLButtonElement).disabled = quantity >= maxStock;
            };

            decreaseBtn.addEventListener('click', () => {
                if (quantity > 1) {
                    quantity--;
                    qtySpan.textContent = quantity.toString();
                    updateButtons();
                }
            });

            increaseBtn.addEventListener('click', () => {
                if (quantity < maxStock) {
                    quantity++;
                    qtySpan.textContent = quantity.toString();
                    updateButtons();
                }
            });
        }
    }

    private setupAddToCart(): void {
        const addBtn = document.getElementById('add-to-cart-btn');
        if (!addBtn || !this.product) return;

        addBtn.addEventListener('click', () => {
            const qtySpan = document.getElementById('qty-value');
            const quantity = qtySpan ? parseInt(qtySpan.textContent || '1', 10) : 1;

            CartService.addProduct(this.product!, quantity);

            const successMsg = document.getElementById('add-success');
            if (successMsg) {
                successMsg.style.display = 'block';
                setTimeout(() => {
                    successMsg.style.display = 'none';
                }, 3000);
            }

            this.updateCartCount();
            this.render();
        });
    }

    private setupLogout(): void {
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                destroySession();
            });
        }
    }

    private updateCartCount(): void {
        const cart = CartService.getCart();
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = totalItems.toString();
            cartCountElement.style.display = totalItems > 0 ? 'inline-block' : 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ProductDetail();
});
