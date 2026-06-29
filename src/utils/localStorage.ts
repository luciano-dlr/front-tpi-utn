
import type { CartItem, Product } from "../types/product";
import type { Order } from "../types/order";

const CART_STORAGE_KEY = 'shopping_cart';
const ORDERS_KEY = 'user_orders';

export class CartService {
    
    static getCart(): CartItem[] {
        const cartData = localStorage.getItem(CART_STORAGE_KEY);
        return cartData ? JSON.parse(cartData) : [];
    }
    
    static saveCart(cart: CartItem[]): void {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
    
    static addProduct(product: Product): void {
        const cart = this.getCart();
        const existingItem = cart.find(item => item.product.id === product.id);
        
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ product, quantity: 1 });
        }
        
        this.saveCart(cart);
    }
    
    static removeProduct(productId: number): void {
        const cart = this.getCart();
        const filteredCart = cart.filter(item => item.product.id !== productId);
        this.saveCart(filteredCart);
    }
    
    static updateQuantity(productId: number, newQuantity: number): void {
        if (newQuantity <= 0) {
            this.removeProduct(productId);
            return;
        }
        
        const cart = this.getCart();
        const item = cart.find(item => item.product.id === productId);
        
        if (item) {
            item.quantity = newQuantity;
            this.saveCart(cart);
        }
    }
    
    static getTotal(): number {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + (item.product.precio * item.quantity), 0);
    }
    
    static getAvailableStock(product: Product): number {
        const cart = this.getCart();
        const cartItem = cart.find(item => item.product.id === product.id);
        const cartQuantity = cartItem ? cartItem.quantity : 0;
        return product.stock - cartQuantity;
    }
    
    static clearCart(): void {
        localStorage.removeItem(CART_STORAGE_KEY);
    }

    static getOrders(): Order[] {
        const data = localStorage.getItem(ORDERS_KEY);
        return data ? JSON.parse(data) : [];
    }

    static saveOrder(order: Order): void {
        const orders = this.getOrders();
        orders.push(order);
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    }
}
