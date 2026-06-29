import { requireAdmin, destroySession } from '../../../utils/auth';
import { AdminStore } from '../../../utils/admin-store';
import type { Product } from '../../../types/product';
import type { ICategory } from '../../../types/category';

class AdminProducts {
    private productStore = new AdminStore<Product>();
    private categoryStore = new AdminStore<ICategory>();
    private editingId: number | null = null;

    constructor() {
        this.init();
    }

    private async init(): Promise<void> {
        requireAdmin();
        await Promise.all([
            this.productStore.loadFromJSON('/data/productos.json'),
            this.categoryStore.loadFromJSON('/data/categorias.json'),
        ]);
        this.populateCategorySelect();
        this.renderTable();
        this.setupEventListeners();
    }

    private getCategoryName(categoriaId: number): string {
        const cat = this.categoryStore.getById(categoriaId);
        return cat?.nombre ?? 'Sin categoría';
    }

    private renderTable(): void {
        const tbody = document.getElementById('products-tbody');
        const emptyState = document.getElementById('empty-state');
        if (!tbody || !emptyState) return;

        const items = this.productStore.getAll();

        if (items.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        tbody.innerHTML = '';

        items.forEach(product => {
            const imgSrc = product.imagen || 'https://placehold.co/50x50?text=?';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${product.id}</td>
                <td>${product.nombre}</td>
                <td>${product.descripcion || '-'}</td>
                <td>$${product.precio.toFixed(2)}</td>
                <td>${product.stock}</td>
                <td>${this.getCategoryName(product.categoriaId)}</td>
                <td><img src="${imgSrc}" alt="${product.nombre}" class="img-thumbnail" onerror="this.onerror=null; this.src='https://placehold.co/50x50?text=?'"></td>
                <td>${product.disponible ? 'Sí' : 'No'}</td>
                <td>
                    <div class="actions-cell">
                        <button class="btn-admin btn-admin-primary btn-admin-sm edit-btn" data-id="${product.id}">Editar</button>
                        <button class="btn-admin btn-admin-danger btn-admin-sm delete-btn" data-id="${product.id}">Eliminar</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    private populateCategorySelect(): void {
        const select = document.getElementById('input-categoria') as HTMLSelectElement;
        if (!select) return;
        // Keep the default option
        select.innerHTML = '<option value="">Seleccionar categoría</option>';
        this.categoryStore.getAll().forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id.toString();
            option.textContent = cat.nombre;
            select.appendChild(option);
        });
    }

    private setupEventListeners(): void {
        const newBtn = document.getElementById('btn-nuevo-producto');
        if (newBtn) {
            newBtn.addEventListener('click', () => this.openCreateModal());
        }

        const tbody = document.getElementById('products-tbody');
        if (tbody) {
            tbody.addEventListener('click', (e: MouseEvent) => {
                const target = e.target as HTMLElement;
                const editBtn = target.closest('.edit-btn');
                const deleteBtn = target.closest('.delete-btn');

                if (editBtn) {
                    const id = Number(editBtn.getAttribute('data-id'));
                    this.openEditModal(id);
                } else if (deleteBtn) {
                    const id = Number(deleteBtn.getAttribute('data-id'));
                    this.confirmDelete(id);
                }
            });
        }

        const form = document.getElementById('product-form') as HTMLFormElement;
        if (form) {
            form.addEventListener('submit', (e: SubmitEvent) => this.handleFormSubmit(e));
        }

        const cancelBtn = document.getElementById('btn-cancel-modal');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeModal());
        }

        const overlay = document.getElementById('product-modal');
        if (overlay) {
            overlay.addEventListener('click', (e: MouseEvent) => {
                if (e.target === overlay) this.closeModal();
            });
        }

        // Clear validation errors on input
        const nombreInput = document.getElementById('input-nombre') as HTMLInputElement;
        if (nombreInput) {
            nombreInput.addEventListener('input', () => {
                const error = document.getElementById('error-nombre');
                if (error) error.style.display = 'none';
            });
        }

        const precioInput = document.getElementById('input-precio') as HTMLInputElement;
        if (precioInput) {
            precioInput.addEventListener('input', () => {
                const error = document.getElementById('error-precio');
                if (error) error.style.display = 'none';
            });
        }

        const stockInput = document.getElementById('input-stock') as HTMLInputElement;
        if (stockInput) {
            stockInput.addEventListener('input', () => {
                const error = document.getElementById('error-stock');
                if (error) error.style.display = 'none';
            });
        }

        const categoriaSelect = document.getElementById('input-categoria') as HTMLSelectElement;
        if (categoriaSelect) {
            categoriaSelect.addEventListener('change', () => {
                const error = document.getElementById('error-categoria');
                if (error) error.style.display = 'none';
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

    private openCreateModal(): void {
        this.editingId = null;
        this.setModalTitle('Nuevo Producto');
        this.clearModalFields();
        this.hideErrors();
        this.showModal();
    }

    private openEditModal(id: number): void {
        const product = this.productStore.getById(id);
        if (!product) return;

        this.editingId = id;
        this.setModalTitle('Editar Producto');
        (document.getElementById('input-nombre') as HTMLInputElement).value = product.nombre;
        (document.getElementById('input-descripcion') as HTMLTextAreaElement).value = product.descripcion || '';
        (document.getElementById('input-precio') as HTMLInputElement).value = product.precio.toString();
        (document.getElementById('input-stock') as HTMLInputElement).value = product.stock.toString();
        (document.getElementById('input-categoria') as HTMLSelectElement).value = product.categoriaId.toString();
        (document.getElementById('input-imagen') as HTMLInputElement).value = product.imagen || '';
        (document.getElementById('input-disponible') as HTMLInputElement).checked = product.disponible;
        this.hideErrors();
        this.showModal();
    }

    private closeModal(): void {
        document.getElementById('product-modal')?.classList.remove('active');
        this.editingId = null;
    }

    private handleFormSubmit(e: SubmitEvent): void {
        e.preventDefault();

        const nombre = (document.getElementById('input-nombre') as HTMLInputElement).value.trim();
        if (!nombre) {
            document.getElementById('error-nombre')!.style.display = 'block';
            return;
        }

        const precio = parseFloat((document.getElementById('input-precio') as HTMLInputElement).value);
        if (isNaN(precio) || precio <= 0) {
            document.getElementById('error-precio')!.style.display = 'block';
            return;
        }

        const stock = parseInt((document.getElementById('input-stock') as HTMLInputElement).value, 10);
        if (isNaN(stock) || stock < 0) {
            document.getElementById('error-stock')!.style.display = 'block';
            return;
        }

        const categoriaId = parseInt((document.getElementById('input-categoria') as HTMLSelectElement).value, 10);
        if (isNaN(categoriaId) || !categoriaId) {
            document.getElementById('error-categoria')!.style.display = 'block';
            return;
        }

        const descripcion = (document.getElementById('input-descripcion') as HTMLTextAreaElement).value.trim();
        const imagen = (document.getElementById('input-imagen') as HTMLInputElement).value.trim();
        const disponible = (document.getElementById('input-disponible') as HTMLInputElement).checked;

        if (this.editingId !== null) {
            this.productStore.update(this.editingId, {
                nombre,
                descripcion,
                precio,
                stock,
                categoriaId,
                imagen: imagen || '',
                disponible,
            } as Partial<Product>);
        } else {
            this.productStore.create({
                nombre,
                descripcion,
                precio,
                stock,
                categoriaId,
                imagen: imagen || '',
                disponible,
                eliminado: false,
                createdAt: new Date().toISOString(),
                categorias: [],
            });
        }

        this.closeModal();
        this.renderTable();
    }

    private confirmDelete(id: number): void {
        const product = this.productStore.getById(id);
        if (!product) return;

        if (confirm(`¿Estás seguro de eliminar el producto "${product.nombre}"?`)) {
            this.productStore.delete(id);
            this.renderTable();
        }
    }

    // Helpers
    private setModalTitle(text: string): void {
        const el = document.getElementById('modal-title');
        if (el) el.textContent = text;
    }

    private clearModalFields(): void {
        (document.getElementById('input-nombre') as HTMLInputElement).value = '';
        (document.getElementById('input-descripcion') as HTMLTextAreaElement).value = '';
        (document.getElementById('input-precio') as HTMLInputElement).value = '';
        (document.getElementById('input-stock') as HTMLInputElement).value = '';
        (document.getElementById('input-categoria') as HTMLSelectElement).value = '';
        (document.getElementById('input-imagen') as HTMLInputElement).value = '';
        (document.getElementById('input-disponible') as HTMLInputElement).checked = true;
    }

    private hideErrors(): void {
        const errors = ['error-nombre', 'error-precio', 'error-stock', 'error-categoria'];
        errors.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }

    private showModal(): void {
        document.getElementById('product-modal')?.classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AdminProducts();
});
