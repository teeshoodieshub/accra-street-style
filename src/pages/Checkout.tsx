import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useNavigate } from "react-router-dom";
import { createOrder, initiateDcmPayment } from "@/lib/supabaseApi";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingBag, ChevronLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const NETWORKS = [
  { id: "mtn", name: "MTN", value: "MTN" },
  { id: "airteltigo", name: "AirtelTigo Money", value: "AirtelTigo" },
  { id: "telecel", name: "Telecel Cash", value: "Telecel" },
];

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: "",
    email: "",
    phone_number: "",
    shipping_address: "",
    shipping_city: "Accra",
    payment_network: NETWORKS[0].value,
  });

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <ShoppingBag className="w-12 h-12 mb-4 text-muted-foreground" strokeWidth={1} />
        <h2 className="text-xl font-medium uppercase tracking-widest mb-4">Your cart is empty</h2>
        <Button onClick={() => navigate("/shop")} variant="outline">
          Return to Shop
        </Button>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleNetworkChange = (value: string) => {
    setFormData({ ...formData, payment_network: value });
  };

  const normalizePhoneNumber = (phone: string) => {
    // Remove all non-numeric characters
    const digits = phone.replace(/\D/g, "");
    
    // If it starts with 0, replace with 233
    if (digits.startsWith("0")) {
      return "233" + digits.substring(1);
    }
    
    // If it's 9 or 10 digits and doesn't start with 233, assume it needs 233
    if (digits.length >= 9 && !digits.startsWith("233")) {
      return "233" + digits;
    }
    
    return digits;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const normalizedPhone = normalizePhoneNumber(formData.phone_number);
    
    if (normalizedPhone.length < 12) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid mobile money number.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      // 1. Create Order in Supabase
      const orderId = await createOrder(
        localStorage.getItem("tees_cart_id") || "",
        items,
        totalPrice,
        {
          ...formData,
          phone_number: normalizedPhone,
          payment_method: "Mobile Money",
        }
      );

      if (!orderId) {
        throw new Error("Failed to create order");
      }

      // 2. Initiate Payment Prompt
      toast({
        title: "Initiating Payment",
        description: "Please check your phone for the payment prompt.",
      });

      const paymentResult = await initiateDcmPayment(
        normalizedPhone,
        totalPrice,
        formData.payment_network,
        orderId
      );

      console.log("Payment Result:", paymentResult);

      // Only treat explicit provider acknowledgements as success.
      // Do not infer success from generic message text.
      const responseCode = String(paymentResult?.responseCode ?? "");
      const status = String(paymentResult?.status ?? "").toLowerCase();
      const isSuccess =
        paymentResult?.success === true ||
        responseCode === "000" ||
        status === "success" ||
        status === "approved" ||
        status === "completed";

      if (!isSuccess) {
        throw new Error(
          paymentResult?.message ||
            paymentResult?.error ||
            "Payment request was not accepted. Please try again."
        );
      }

      // 3. Accepted by provider (prompt should arrive on phone)
      toast({
        title: "Payment Request Sent",
        description: `Order #${orderId.slice(0, 8)} created. Approve the prompt on your phone to complete payment.`,
      });

      clearCart();
      navigate("/");
    } catch (error: any) {
      console.error("Checkout Error details:", error);
      let errorMessage = error.message || "Something went wrong. Please try again.";
      
      // Handle Supabase FunctionsHttpError specifically
      if (error.context && typeof error.context.json === 'function') {
        try {
          const body = await error.context.json();
          errorMessage = body.message || body.error || errorMessage;
        } catch (e) {
          // ignore parsing error
        }
      } else if (error.context?.json) {
        // Some versions of the client library might already have parsed it
        const body = error.context.json;
        errorMessage = body.message || body.error || errorMessage;
      }

      toast({
        title: "Checkout Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-12 pt-24">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to shopping
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Checkout Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-2xl font-semibold uppercase tracking-wider mb-2">Checkout</h1>
            <p className="text-sm text-muted-foreground font-light">Complete your order details below</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground pb-2 border-b">
                Shipping Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Full Name</Label>
                  <Input
                    id="customer_name"
                    placeholder="John Doe"
                    required
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    className="rounded-none focus-visible:ring-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="rounded-none focus-visible:ring-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shipping_address">Delivery Address</Label>
                <Input
                  id="shipping_address"
                  placeholder="Street address, Apartment, etc."
                  required
                  value={formData.shipping_address}
                  onChange={handleInputChange}
                  className="rounded-none focus-visible:ring-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shipping_city">City</Label>
                <Input
                  id="shipping_city"
                  placeholder="Accra"
                  required
                  value={formData.shipping_city}
                  onChange={handleInputChange}
                  className="rounded-none focus-visible:ring-foreground"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h2 className="text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground pb-2 border-b">
                Payment Details (Mobile Money)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_network">Network</Label>
                  <Select
                    onValueChange={handleNetworkChange}
                    defaultValue={formData.payment_network}
                  >
                    <SelectTrigger className="rounded-none focus:ring-foreground">
                      <SelectValue placeholder="Select network" />
                    </SelectTrigger>
                    <SelectContent>
                      {NETWORKS.map((network) => (
                        <SelectItem key={network.id} value={network.value}>
                          {network.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Account Number (Momo)</Label>
                  <Input
                    id="phone_number"
                    placeholder="233XXXXXXXXX"
                    required
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="rounded-none focus-visible:ring-foreground"
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                * Ensure your phone is nearby to authorize the payment via USSD prompt.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-foreground text-primary-foreground text-sm uppercase tracking-[0.2em] font-medium transition-opacity hover:opacity-90 rounded-none shadow-none mt-8"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay GHC ${totalPrice.toFixed(2)}`
              )}
            </Button>
          </form>
        </motion.div>

        {/* Order Summary */}
        <div className="bg-secondary/30 p-8 space-y-8 h-fit lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold uppercase tracking-wider">Order Summary</h2>
          <div className="space-y-6">
            {items.map((item) => (
              <div key={`${item.product.id}-${item.size}-${item.color}`} className="flex gap-4">
                <div className="w-20 h-20 bg-secondary shrink-0 overflow-hidden">
                  <img
                    src={item.product.images?.[0] || ""}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">{item.product.name}</p>
                    <p className="text-sm font-semibold">GHC {(item.product.price * item.quantity).toFixed(2)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.size} / {item.color}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Qty: {item.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-6 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">GHC {totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery</span>
              <span className="font-medium text-emerald-600">Free</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-border pt-4">
              <span>Total</span>
              <span>GHC {totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

