export type Estado = 'PENDIENTE' | 'CONFIRMADO' | 'TERMINADO' | 'CANCELADO';
export type FormaPago = 'TARJETA' | 'TRANSFERENCIA' | 'EFECTIVO';

export interface OrderItem {
    idProducto: number;
    nombre: string;
    cantidad: number;
    precio: number;
    subtotal: number;
}

export interface Order {
    id: number;
    idUsuario: number;
    fecha: string;
    estado: Estado;
    total: number;
    formaPago: FormaPago;
    telefono: string;
    productos: OrderItem[];
}
