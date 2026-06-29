import { requireAdmin } from '../../../utils/auth';
import { AdminStore } from '../../../utils/admin-store';
import type { ICategory } from '../../../types/category';

class AdminCategories {
    private store = new AdminStore<ICategory>();
    private editingId: number | null = null;

    constructor() {
        this.init();
    }

    private async init(): Promise<void> {
        requireAdmin();
        await this.store.loadFromJSON('/data/categorias.json');
        this.renderTable();
        this.setupEventListeners();
    }

    private renderTable(): void {
        const tbody = document.getElementById('categories-tbody');
        const emptyState = document.getElementById('empty-state');
        if (!tbody || !emptyState) return;

        const items = this.store.getAll();

        if (items.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        tbody.innerHTML = '';

        items.forEach(cat => {
            const imgSrc = cat.imagen || 'https://placehold.co/50x50?text=?';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cat.id}</td>
                <td><img src="${imgSrc}" alt="${cat.nombre}" class="img-thumbnail" onerror="this.onerror=null; this.src='https://placehold.co/50x50?text=?'"></td>
                <td>${cat.nombre}</td>
                <td>${cat.descripcion || '-'}</td>
                <td>
                    <div class="actions-cell">
                        <button class="btn-admin btn-admin-primary btn-admin-sm edit-btn" data-id="${cat.id}">Editar</button>
                        <button class="btn-admin btn-admin-danger btn-admin-sm delete-btn" data-id="${cat.id}">Eliminar</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    private setupEventListeners(): void {
        // Nueva Categoría button
        const newBtn = document.getElementById('btn-nueva-categoria');
        if (newBtn) {
            newBtn.addEventListener('click', () => this.openCreateModal());
        }

        // Table action buttons — event delegation
        const tbody = document.getElementById('categories-tbody');
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

        // Modal form submit
        const form = document.getElementById('category-form') as HTMLFormElement;
        if (form) {
            form.addEventListener('submit', (e: SubmitEvent) => this.handleFormSubmit(e));
        }

        // Cancel button
        const cancelBtn = document.getElementById('btn-cancel-modal');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeModal());
        }

        // Close modal on overlay click
        const overlay = document.getElementById('category-modal');
        if (overlay) {
            overlay.addEventListener('click', (e: MouseEvent) => {
                if (e.target === overlay) this.closeModal();
            });
        }

        // Clear validation error on input
        const nombreInput = document.getElementById('input-nombre') as HTMLInputElement;
        if (nombreInput) {
            nombreInput.addEventListener('input', () => {
                const error = document.getElementById('error-nombre');
                if (error) error.style.display = 'none';
            });
        }
    }

    private openCreateModal(): void {
        this.editingId = null;
        this.setModalTitle('Nueva Categoría');
        this.clearModalFields();
        this.hideErrors();
        this.showModal();
    }

    private openEditModal(id: number): void {
        const cat = this.store.getById(id);
        if (!cat) return;

        this.editingId = id;
        this.setModalTitle('Editar Categoría');
        this.setModalFields(cat.nombre, cat.descripcion || '', cat.imagen || '');
        this.hideErrors();
        this.showModal();
    }

    private closeModal(): void {
        document.getElementById('category-modal')?.classList.remove('active');
        this.editingId = null;
    }

    private handleFormSubmit(e: SubmitEvent): void {
        e.preventDefault();

        const nombre = (document.getElementById('input-nombre') as HTMLInputElement).value.trim();
        if (!nombre) {
            document.getElementById('error-nombre')!.style.display = 'block';
            return;
        }

        const descripcion = (document.getElementById('input-descripcion') as HTMLTextAreaElement).value.trim();
        const imagen = (document.getElementById('input-imagen') as HTMLInputElement).value.trim();

        if (this.editingId !== null) {
            this.store.update(this.editingId, { nombre, descripcion, imagen } as Partial<ICategory>);
        } else {
            this.store.create({
                nombre,
                descripcion,
                imagen: imagen || '',
                eliminado: false,
                createdAt: new Date().toISOString(),
            });
        }

        this.closeModal();
        this.renderTable();
    }

    private confirmDelete(id: number): void {
        const cat = this.store.getById(id);
        if (!cat) return;

        if (confirm(`¿Estás seguro de eliminar la categoría "${cat.nombre}"?`)) {
            this.store.delete(id);
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
        (document.getElementById('input-imagen') as HTMLInputElement).value = '';
    }

    private setModalFields(nombre: string, descripcion: string, imagen: string): void {
        (document.getElementById('input-nombre') as HTMLInputElement).value = nombre;
        (document.getElementById('input-descripcion') as HTMLTextAreaElement).value = descripcion;
        (document.getElementById('input-imagen') as HTMLInputElement).value = imagen;
    }

    private hideErrors(): void {
        const error = document.getElementById('error-nombre');
        if (error) error.style.display = 'none';
    }

    private showModal(): void {
        document.getElementById('category-modal')?.classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AdminCategories();
});
