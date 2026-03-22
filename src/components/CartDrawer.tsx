import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeItem, updateQuantity, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate("/checkout");
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 z-50"
            onClick={() => setIsCartOpen(false)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-background z-50 flex flex-col border-l border-border"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-sm font-medium uppercase tracking-[0.1em]">
                  Cart ({totalItems})
                </span>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-1 transition-opacity hover:opacity-60">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ShoppingBag className="w-12 h-12 mb-4" strokeWidth={1} />
                  <p className="text-sm uppercase tracking-[0.15em]">Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <AnimatePresence>
                    {items.map((item) => {
                      const variantLabel = item.product.useDesignSelection ? "Design" : "Color";
                      return (
                      <motion.div
                        key={`${item.product.id}-${item.size}-${item.color}`}
                        layout
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ duration: 0.3 }}
                        className="flex gap-4"
                      >
                        <img
                          src={item.product.images?.[0] || ""}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover bg-secondary"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Size: {item.size} Â· {variantLabel}: {item.color}
                          </p>
                          <p className="text-sm font-semibold mt-1">GHC {item.product.price}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center border border-border transition-colors hover:border-foreground"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs tabular-nums">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center border border-border transition-colors hover:border-foreground"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removeItem(item.product.id, item.size, item.color)}
                              className="ml-auto text-[11px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-border">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Total</span>
                  <span className="text-lg font-semibold tabular-nums">GHC {totalPrice}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full h-12 bg-foreground text-primary-foreground text-sm uppercase tracking-[0.1em] font-medium transition-opacity hover:opacity-90"
                >
                  Checkout
                </button>
                <p className="text-[11px] text-muted-foreground text-center mt-3">Free delivery in Accra</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

