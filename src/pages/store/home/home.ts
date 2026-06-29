import { fetchProducts, fetchCategories } from '../../../utils/fetch';
import { requireAuth } from '../../../utils/auth';
import type { ICategory } from "../../../types/category";
import type { Product } from "../../../types/product";
import {  CartService } from "../../../utils/localStorage";


class StoreHome {
    private products: Product[] = [];
    private categories: ICategory[] = [];
    private currentProducts: Product[] = [];
    private currentCategory: string | null = null;
    private searchTerm: string = '';
    
    constructor() {
        this.init();
    }

    private async init(): Promise<void> {
        requireAuth();

        // Fetch categories and build lookup map
        const rawCategories = await fetchCategories();
        this.categories = rawCategories;
        const categoryMap: Record<number, ICategory> = {};
        rawCategories.forEach((cat: any) => {
            categoryMap[cat.id] = cat as ICategory;
        });

        // Fetch products and map categoriaId → categorias array
        const rawProducts = await fetchProducts();
        this.products = rawProducts.map((p: any) => ({
            ...p,
            categorias: p.categoriaId ? [categoryMap[p.categoriaId]].filter(Boolean) : [],
        })) as Product[];
        this.currentProducts = [...this.products];

        this.renderCategories();
        this.renderProducts();
        this.setupEventListeners();
        this.updateCartCount();
    }
    
    private setupEventListeners(): void {
        const searchInput = document.getElementById('search-input') as HTMLInputElement;
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
                this.applyFilters();
            });
        } else {
            console.warn('earch-input NO encontrado en el DOM');
        }
        
        const showAllBtn = document.getElementById('show-all-btn');
        if (showAllBtn) {
            showAllBtn.addEventListener('click', () => {
                this.currentCategory = null;
                this.applyFilters();
                this.setActiveCategory('');
            });
        } else {
            console.warn('show-all-btn NO encontrado en el DOM');
        }

        const sortSelect = document.getElementById('sort-select') as HTMLSelectElement;
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.applyFilters();
            });
        } else {
            console.warn('sort-select NO encontrado en el DOM');
        }
    }
    
    private applyFilters(): void {
        let filtered = [...this.products];
        
        if (this.currentCategory) {
            filtered = filtered.filter(product => 
                product.categorias.some(cat => cat.nombre === this.currentCategory)
            );
        }
        
        if (this.searchTerm) {
            filtered = filtered.filter(product => 
                product.nombre.toLowerCase().includes(this.searchTerm)
            );
        }
        
        this.currentProducts = filtered;
        this.applySort();
        this.renderProducts();
        this.showNoResultsMessage(filtered.length === 0);
    }

    private applySort(): void {
        const sortSelect = document.getElementById('sort-select') as HTMLSelectElement;
        if (!sortSelect) return;

        const sortValue = sortSelect.value;

        this.currentProducts.sort((a, b) => {
            switch (sortValue) {
                case 'name-asc': return a.nombre.localeCompare(b.nombre);
                case 'name-desc': return b.nombre.localeCompare(a.nombre);
                case 'price-asc': return a.precio - b.precio;
                case 'price-desc': return b.precio - a.precio;
                default: return 0;
            }
        });
    }
    
    private showNoResultsMessage(isEmpty: boolean): void {
        const container = document.getElementById('contenedor-productos');
        const noResultsMsg = document.getElementById('no-results-message');
        
        if (isEmpty && container) {
            if (!noResultsMsg) {
                const messageDiv = document.createElement('div');
                messageDiv.id = 'no-results-message';
                messageDiv.className = 'no-results';
                messageDiv.innerHTML = '<p>No se encontraron productos que coincidan con tu búsqueda.</p>';
                container.appendChild(messageDiv);
            }
        } else if (noResultsMsg) {
            noResultsMsg.remove();
        }
    }
    
    private renderCategories(): void {
        const container = document.getElementById('lista-categorias');
        if (!container) {
            return;
        }
        
        container.innerHTML = '';
        
        this.categories.forEach(category => {
            const li = document.createElement('li');
            const button = document.createElement('button');
            button.textContent = category.nombre;
            button.className = 'category-btn';
            button.addEventListener('click', () => {
                this.currentCategory = category.nombre;
                this.applyFilters();
                this.setActiveCategory(category.nombre);
            });
            li.appendChild(button);
            container.appendChild(li);
        });
    }
    
    private setActiveCategory(activeCategory: string): void {
        const buttons = document.querySelectorAll('.category-btn');
        buttons.forEach(btn => {
            if (btn.textContent === activeCategory) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        const showAllBtn = document.getElementById('show-all-btn');
        if (showAllBtn) {
            if (activeCategory === '') {
                showAllBtn.classList.add('active');
            } else {
                showAllBtn.classList.remove('active');
            }
        }
    }
    
    private renderProducts(): void {
        const container = document.getElementById('contenedor-productos');
        if (!container) {
            console.warn(' contenedor-productos NO encontrado en el DOM');
            return;
        }
        
        if (this.currentProducts.length === 0) {
            this.showNoResultsMessage(true);
            return;
        }
        
        container.innerHTML = '';
        
        this.currentProducts.forEach(product => {
            const productCard = this.createProductCard(product);
            container.appendChild(productCard);
        });
    }
    
    private createProductCard(product: Product): HTMLElement {
        const availableStock = CartService.getAvailableStock(product);
        const outOfStock = !product.disponible || availableStock <= 0;
        
        const article = document.createElement('article');
        article.className = 'product-card';
        article.innerHTML = `
            <img src="${product.imagen}" alt="${product.nombre}" loading="lazy" onerror="this.onerror=null; this.src='https://placehold.co/300x200?text=${product.nombre}'">
            <h3>${product.nombre}</h3>
            <p class="product-description">${product.descripcion}</p>
            <strong class="product-price">$${product.precio.toLocaleString()}</strong>
            <p class="product-stock">Stock: ${availableStock}</p>
            ${outOfStock ? '<span class="out-of-stock">Sin stock</span>' : ''}
            <button class="btn-agregar" data-product-id="${product.id}" ${outOfStock ? 'disabled' : ''}>
                Agregar al carrito
            </button>
            <a href="../productDetail/productDetail.html?id=${product.id}" class="ver-detalle-link">Ver detalle</a>
        `;
        
        const addButton = article.querySelector('.btn-agregar');
        if (addButton && product.disponible && availableStock > 0) {
            addButton.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.addToCart(product);
            });
        }
        
        // Navigate to product detail on card click
        article.style.cursor = 'pointer';
        article.addEventListener('click', (e) => {
            if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
            window.location.href = `../productDetail/productDetail.html?id=${product.id}`;
        });
        
        return article;
    }
    
    private addToCart(product: Product): void {
        if (CartService.getAvailableStock(product) <= 0) {
            alert('No hay suficiente stock disponible');
            this.renderProducts();
            return;
        }
        CartService.addProduct(product);
        this.updateCartCount();
        this.renderProducts();
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


let storeHomeInstance: StoreHome | null = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!storeHomeInstance) {
        storeHomeInstance = new StoreHome();
    } else {
        console.log(' Instancia ya existía, se saltó la creación');
    }
});
