import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { CartProducto } from '../models/producto.if';

export interface CartItem extends CartProducto {
    cantidad: number;
}

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private readonly STORAGE_KEY = 'app_cart_v1';
    private _cart = new BehaviorSubject<CartItem[]>(this.loadFromStorage());
    public cart$ = this._cart.asObservable();
    public total$ = this.cart$.pipe(
        map(items => items.reduce((acc, it) => acc + (it.precio || 0) * (it.cantidad || 0), 0))        
    );

    constructor() { }

    private loadFromStorage(): CartItem[] {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return [];
            return JSON.parse(raw) as CartItem[];
        } catch {
            return [];
        }
    }

    private saveToStorage(items: CartItem[]) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
        } catch {
            // ignore
        }
    }

    getItems(): CartItem[] {
        return this._cart.getValue();
    }

    addProduct(product: CartProducto) {
        const items = [...this._cart.getValue()];
        const idx = items.findIndex(i => i.id_Producto === product.id_Producto);
        if (idx >= 0) {
            items[idx].cantidad = (items[idx].cantidad || 1) + 1;
        } else {
            const newItem: CartItem = { ...product, cantidad: 1 };
            items.push(newItem);
        }
        this._cart.next(items);
        this.saveToStorage(items);
    }

    removeProduct(id_Producto: number | undefined) {
        const items = this._cart.getValue().filter(i => i.id_Producto !== id_Producto);
        this._cart.next(items);
        this.saveToStorage(items);
    }

    updateQuantity(id_Producto: number | undefined, cantidad: number) {
        const items = [...this._cart.getValue()];
        const idx = items.findIndex(i => i.id_Producto === id_Producto);
        if (idx >= 0) {
            items[idx].cantidad = Math.max(0, Math.floor(cantidad));
            if (items[idx].cantidad === 0) {
                items.splice(idx, 1);
            }
            this._cart.next(items);
            this.saveToStorage(items);
        }
    }

    clear() {
        this._cart.next([]);
        this.saveToStorage([]);
    }
}
