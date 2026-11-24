import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface CartItem {
  producto_id: number
  nombre: string
  precio_unitario: number
  cantidad: number
  imagen_url: string | null
  /** Stock conocido al agregar: limita la cantidad en el carrito (el backend valida igual). */
  stock: number
}

export type ProductoParaCarrito = Omit<CartItem, 'cantidad'>

interface CartState {
  items: CartItem[]
  agregar: (producto: ProductoParaCarrito, cantidad?: number) => void
  quitar: (productoId: number) => void
  cambiarCantidad: (productoId: number, cantidad: number) => void
  vaciar: () => void
  total: () => number
  cantidadTotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      agregar: (producto, cantidad = 1) =>
        set((state) => {
          const existente = state.items.find((i) => i.producto_id === producto.producto_id)
          if (existente) {
            return {
              items: state.items.map((i) =>
                i.producto_id === producto.producto_id
                  ? { ...i, ...producto, cantidad: Math.min(i.cantidad + cantidad, producto.stock) }
                  : i,
              ),
            }
          }
          return { items: [...state.items, { ...producto, cantidad: Math.min(cantidad, producto.stock) }] }
        }),

      quitar: (productoId) => set((state) => ({ items: state.items.filter((i) => i.producto_id !== productoId) })),

      cambiarCantidad: (productoId, cantidad) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.producto_id === productoId ? { ...i, cantidad: Math.min(Math.max(cantidad, 0), i.stock) } : i))
            .filter((i) => i.cantidad > 0),
        })),

      vaciar: () => set({ items: [] }),

      total: () => get().items.reduce((acc, i) => acc + i.precio_unitario * i.cantidad, 0),

      cantidadTotal: () => get().items.reduce((acc, i) => acc + i.cantidad, 0),
    }),
    {
      name: 'foodstore-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
)
