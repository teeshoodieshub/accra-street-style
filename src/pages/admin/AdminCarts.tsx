import { useQuery } from "@tanstack/react-query";
import { listCarts } from "@/lib/supabaseApi";

export default function AdminCarts() {
  const { data: carts = [] } = useQuery({
    queryKey: ["admin-carts"],
    queryFn: listCarts,
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Carts</h2>
        <span className="text-xs text-muted-foreground">{carts.length} total</span>
      </div>
      <div className="space-y-4">
        {carts.map((cart) => (
          <div key={cart.id} className="border border-border p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Cart {cart.id}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(cart.created_at).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{cart.status}</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {cart.cart_items?.map((item, index) => (
                <div key={`${cart.id}-${index}`} className="flex items-center gap-3 text-sm">
                  <div className="w-12 h-12 bg-secondary overflow-hidden">
                    {item.product?.image_urls && item.product.image_urls.length > 0 && (
                      <img src={item.product.image_urls[0]} alt={item.product.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{item.product?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} x {item.size}, {item.color}
                    </p>
                  </div>
                </div>
              ))}
              {(!cart.cart_items || cart.cart_items.length === 0) && (
                <p className="text-sm text-muted-foreground">No items.</p>
              )}
            </div>
          </div>
        ))}
        {carts.length === 0 && (
          <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No carts yet.
          </div>
        )}
      </div>
    </section>
  );
}
