import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listOrders, listCustomOrders, updateCustomOrderStatus, updateOrderStatus } from "@/lib/supabaseApi";
import { toast } from "sonner";
import { Download, Loader2, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"store" | "custom">("store");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const toggleOrder = (id: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const { data: storeOrders = [], isLoading: loadingStore } = useQuery({
    queryKey: ["admin-orders", "store"],
    queryFn: listOrders,
  });

  const { data: customOrders = [], isLoading: loadingCustom } = useQuery({
    queryKey: ["admin-orders", "custom"],
    queryFn: listCustomOrders,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, type }: { id: string; status: string; type: "store" | "custom" }) => 
      type === "custom" ? updateCustomOrderStatus(id, status) : updateOrderStatus(id, status),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders", variables.type] });
      if (result.emailSent) {
        toast.success("Order status updated and customer email sent");
        return;
      }
      toast.success(`Order status updated (${result.emailSkippedReason || "email not sent"})`);
    },
    onError: (error: any) => {
      toast.error(`Failed to update status: ${error.message || "Unknown error"}`);
    }
  });

  const handleStatusChange = (id: string, newStatus: string, type: "store" | "custom") => {
    updateStatusMutation.mutate({ id, status: newStatus, type });
  };

  return (
    <section>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8 pb-4 border-b border-border">
        <h2 className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Orders Management</h2>
        
        <div className="flex bg-secondary p-1 rounded-sm text-sm">
          <button
            onClick={() => setActiveTab("store")}
            className={`px-4 py-1.5 transition-colors ${activeTab === "store" ? "bg-background shadow-sm" : "hover:bg-background/50"}`}
          >
            Store Orders ({storeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`px-4 py-1.5 transition-colors ${activeTab === "custom" ? "bg-background shadow-sm" : "hover:bg-background/50"}`}
          >
            Custom Prints ({customOrders.length})
          </button>
        </div>
      </div>

      {activeTab === "store" && (
        <div className="space-y-4">
          {loadingStore && <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>}
          
          {storeOrders.map((order) => {
            const isExpanded = expandedOrders.has(order.id);
            return (
              <div key={order.id} className="border border-border">
                <button 
                  onClick={() => toggleOrder(order.id)}
                  className="w-full flex flex-wrap items-center justify-between gap-4 p-5 hover:bg-secondary/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full transition-colors ${isExpanded ? "bg-foreground text-background" : "bg-secondary"}`}>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium flex items-center gap-2">
                        Order {order.id.slice(0,8)}...
                        <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full uppercase tracking-wider">{order.status}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">GH₵{order.total}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center justify-end gap-1">
                      <Eye className="w-3 h-3" /> {isExpanded ? "Hide" : "View"} Details
                    </p>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden bg-secondary/10"
                    >
                      <div className="px-5 pb-5 pt-2 border-t border-border/50">
                        <div className="space-y-3 mt-2">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-4">Items Summary</p>
                          {order.order_items?.map((item, index) => (
                            <div key={`${order.id}-${index}`} className="flex items-center gap-4 text-sm group">
                              <div className="w-14 h-14 bg-secondary overflow-hidden shrink-0 rounded-sm border border-border/50">
                                {item.product?.image_urls && item.product.image_urls.length > 0 && (
                                  <img src={item.product.image_urls[0]} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.product?.name}</p>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground">{item.quantity}</span> x GH₵{item.unit_price}
                                  </p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    Size: <span className="font-medium text-foreground uppercase">{item.size}</span>
                                  </p>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    Color: 
                                    <span 
                                      className="inline-block w-2.5 h-2.5 rounded-full border border-border" 
                                      style={{ backgroundColor: item.color }} 
                                      title={item.color}
                                    />
                                    <span className="font-medium text-foreground italic">{item.color}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-medium">GH₵{item.quantity * item.unit_price}</p>
                              </div>
                            </div>
                          ))}
                          {(!order.order_items || order.order_items.length === 0) && (
                            <p className="text-sm text-muted-foreground italic py-2">No item details available.</p>
                          )}
                        </div>
                        
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-dotted border-border pt-6">
                           <div className="space-y-2">
                             <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Customer Contact</p>
                             <div className="space-y-1 text-xs">
                               <p className="font-semibold">{order.customer_name || "N/A"}</p>
                               <p className="text-muted-foreground">{order.phone_number || "No phone"}</p>
                               <p className="text-muted-foreground truncate" title={order.email}>{order.email || "No email"}</p>
                             </div>
                           </div>
                           <div className="space-y-2">
                             <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Shipping Address</p>
                             <div className="space-y-1 text-xs">
                               <p className="text-muted-foreground leading-relaxed">
                                 {order.shipping_address ? (
                                   <>
                                     {order.shipping_address}<br />
                                     {order.shipping_city}
                                   </>
                                 ) : "Pickup/Local"}
                               </p>
                             </div>
                           </div>
                           <div className="space-y-2">
                             <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Payment Details</p>
                             <div className="space-y-1 text-xs">
                               <p className="text-muted-foreground">Method: <span className="font-medium text-foreground">{order.payment_method || "Unknown"}</span></p>
                               {order.payment_network && <p className="text-muted-foreground">Network: <span className="font-medium text-foreground">{order.payment_network}</span></p>}
                               <p className="text-muted-foreground">Payment: <span className={`font-bold ${order.payment_status === 'completed' ? 'text-green-600' : 'text-orange-500'}`}>{order.payment_status || "Pending"}</span></p>
                             </div>
                           </div>
                        </div>

                        <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-end border-t border-border pt-6 gap-6">
                           <div className="space-y-4 flex-1">
                             <div className="space-y-1">
                               <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Internal Notes</p>
                               <p className="text-xs text-muted-foreground italic">Store order processed via checkout flow.</p>
                             </div>
                             
                             <div className="w-full max-w-[240px] pt-2">
                               <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">Update Order Status</p>
                               <select 
                                 value={order.status}
                                 onChange={(e) => handleStatusChange(order.id, e.target.value, "store")}
                                 disabled={updateStatusMutation.isPending}
                                 className="w-full h-10 px-3 text-xs border border-border bg-background focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
                               >
                                 <option value="Pending">Pending</option>
                                 <option value="Processing">Processing</option>
                                 <option value="Shipped">Shipped</option>
                                 <option value="Delivered">Delivered</option>
                                 <option value="Cancelled">Cancelled</option>
                               </select>
                             </div>
                           </div>
                           <div className="text-right flex flex-col items-end gap-1">
                             <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground font-mono">Order Financials</p>
                             <div className="w-48 space-y-1.5 pt-2">
                               <div className="flex justify-between text-[11px]">
                                 <span className="text-muted-foreground">Subtotal</span>
                                 <span>GH₵{order.total}</span>
                               </div>
                               <div className="flex justify-between text-xs font-bold border-t border-border pt-2">
                                 <span>Grand Total</span>
                                 <span>GH₵{order.total}</span>
                               </div>
                             </div>
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          {!loadingStore && storeOrders.length === 0 && (
            <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No store orders yet.
            </div>
          )}
        </div>
      )}

      {activeTab === "custom" && (
        <div className="space-y-4">
          {loadingCustom && <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>}
          
          {customOrders.map((order) => {
            const isExpanded = expandedOrders.has(order.id);
            return (
              <div key={order.id} className="border border-border">
                <button 
                  onClick={() => toggleOrder(order.id)}
                  className="w-full flex flex-wrap items-center justify-between gap-6 p-5 hover:bg-secondary/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`p-2 rounded-full transition-colors ${isExpanded ? "bg-foreground text-background" : "bg-secondary"}`}>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-medium">Order {order.id.slice(0,8)}...</p>
                        <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] uppercase font-bold tracking-tight">
                          {order.product_type}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {order.customer_name} — {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="hidden sm:block text-right">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Status</p>
                      <p className={`text-xs font-bold ${order.status === 'Cancelled' ? 'text-red-500' : order.status === 'Delivered' ? 'text-green-600' : 'text-foreground'}`}>
                        {order.status}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                        <Eye className="w-3 h-3" /> {isExpanded ? "Hide" : "View"} Details
                      </p>
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden bg-secondary/5"
                    >
                      <div className="p-6 border-t border-border/50">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
                          <div className="flex-1 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                              <div className="space-y-2">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Customer Contact</p>
                                <div className="space-y-1">
                                  <p className="font-semibold text-foreground">{order.customer_name}</p>
                                  <p className="text-xs flex items-center gap-2 text-muted-foreground">
                                    <span className="w-1 h-1 bg-muted-foreground rounded-full" /> {order.phone_number}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate" title={order.email}>
                                    <span className="w-1 h-1 bg-muted-foreground rounded-full" /> {order.email}
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Order Specifications</p>
                                <div className="space-y-1 text-xs">
                                  <p className="text-muted-foreground text-[11px]">Quantity: <span className="font-bold text-foreground">{order.quantity}</span></p>
                                  <p className="text-muted-foreground text-[11px]">Color: <span className="font-bold text-foreground">{order.product_color}</span></p>
                                  <p className="text-muted-foreground text-[11px]">Sizes: <span className="font-bold text-foreground">{order.sizes.join(', ')}</span></p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Delivery Destination</p>
                                <p className="text-xs leading-relaxed text-muted-foreground">{order.delivery_location}</p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Print Configuration</p>
                                <div className="space-y-1">
                                  <p className="text-xs font-medium">{order.print_placement}</p>
                                  {order.custom_text && (
                                    <div className="mt-2 p-2 bg-background border border-border/50 rounded-sm italic text-[11px] text-muted-foreground">
                                      "{order.custom_text}"
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {order.order_notes && (
                              <div className="bg-secondary/30 p-4 rounded-sm border border-border/50">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">Order Notes</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">{order.order_notes}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-4 lg:w-56 shrink-0 pt-2">
                            <div className="bg-background p-4 border border-border shadow-sm space-y-4">
                              <div>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">Update Status</p>
                                <select 
                                  value={order.status}
                                  onChange={(e) => handleStatusChange(order.id, e.target.value, "custom")}
                                  disabled={updateStatusMutation.isPending}
                                  className="w-full h-10 px-3 text-xs border border-border bg-background focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="In Production">In Production</option>
                                  <option value="Ready">Ready</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </div>

                              {order.design_file_url && (
                                <a 
                                  href={order.design_file_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-2 w-full h-10 bg-foreground text-background hover:bg-foreground/90 transition-colors text-xs font-bold uppercase tracking-wider"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Download Design
                                </a>
                              )}
                            </div>
                            
                            <div className="px-1">
                              <p className="text-[9px] text-muted-foreground italic">
                                Last updated: {new Date(order.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          {!loadingCustom && customOrders.length === 0 && (
            <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No custom print orders yet.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
