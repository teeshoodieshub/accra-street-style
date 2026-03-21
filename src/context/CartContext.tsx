import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Product } from "@/data/products";
import { toast } from "@/hooks/use-toast";
import { clearCartRemote, createOrder, fetchCartItems, getOrCreateCartId, setCartItemQuantity } from "@/lib/supabaseApi";

export type CartItem = {
  product: Product;
  size: string;
  color: string;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (product: Product, size: string, color: string) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartId, setCartId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const id = await getOrCreateCartId();
        if (!active) return;
        setCartId(id);
        const remoteItems = await fetchCartItems(id);
        if (!active) return;
        if (remoteItems.length > 0) {
          setItems((prev) => {
            if (prev.length > 0) return prev;
            return remoteItems.map((item) => ({
              product: {
                id: item.product.id,
                name: item.product.name,
                price: item.product.price,
                category: item.product.category,
                images: item.product.image_urls || [],
                colors: item.product.colors,
                sizes: item.product.sizes,
                description: item.product.description,
                specs: item.product.specs,
                isNew: item.product.is_new ?? false,
              },
              size: item.size,
              color: item.color,
              quantity: item.quantity,
            }));
          });
        }
      } catch (error) {
        toast({ title: "Cart unavailable", description: "Couldn't load cart from Supabase." });
      }
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!cartId || items.length === 0) return;
    items.forEach((item) => {
      setCartItemQuantity(cartId, item.product.id, item.size, item.color, item.quantity).catch(() => {
        toast({ title: "Cart sync failed", description: "Couldn't sync cart items." });
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartId]);

  const addItem = (product: Product, size: string, color: string) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.product.id === product.id && i.size === size && i.color === color
      );
      if (existing) {
        const nextItems = prev.map((i) =>
          i.product.id === product.id && i.size === size && i.color === color
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
        const nextQty = existing.quantity + 1;
        if (cartId) {
          setCartItemQuantity(cartId, product.id, size, color, nextQty).catch(() => {
            toast({ title: "Cart sync failed", description: "Couldn't update item quantity." });
          });
        }
        return nextItems;
      }
      if (cartId) {
        setCartItemQuantity(cartId, product.id, size, color, 1).catch(() => {
          toast({ title: "Cart sync failed", description: "Couldn't add item to cart." });
        });
      }
      return [...prev, { product, size, color, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeItem = (productId: string, size: string, color: string) => {
    if (cartId) {
      setCartItemQuantity(cartId, productId, size, color, 0).catch(() => {
        toast({ title: "Cart sync failed", description: "Couldn't remove item." });
      });
    }
    setItems((prev) =>
      prev.filter(
        (i) => !(i.product.id === productId && i.size === size && i.color === color)
      )
    );
  };

  const updateQuantity = (productId: string, size: string, color: string, qty: number) => {
    if (qty <= 0) {
      removeItem(productId, size, color);
      return;
    }
    if (cartId) {
      setCartItemQuantity(cartId, productId, size, color, qty).catch(() => {
        toast({ title: "Cart sync failed", description: "Couldn't update quantity." });
      });
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId && i.size === size && i.color === color
          ? { ...i, quantity: qty }
          : i
      )
    );
  };

  const clearCart = () => {
    if (cartId) {
      clearCartRemote(cartId).catch(() => {
        toast({ title: "Cart sync failed", description: "Couldn't clear cart." });
      });
    }
    setItems([]);
  };

  const totalItems = useMemo(() => items.reduce((acc, i) => acc + i.quantity, 0), [items]);
  const totalPrice = useMemo(() => items.reduce((acc, i) => acc + i.product.price * i.quantity, 0), [items]);



  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, isCartOpen, setIsCartOpen }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
