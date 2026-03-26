import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import {
  createOrder,
  getDcmPaymentOutcome,
  getOrderPaymentSnapshot,
  initiateDcmPayment,
  updateOrderPaymentState,
} from "@/lib/supabaseApi";
import { getPaymentPhaseFromStatus, type DcmPaymentPhase } from "@/lib/dcmPayment";
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

const NETWORKS = [
  { id: "mtn", name: "MTN", value: "MTN" },
  { id: "airteltigo", name: "AirtelTigo Money", value: "AirtelTigo" },
  { id: "telecel", name: "Telecel Cash", value: "Telecel" },
];

const PENDING_PAYMENT_KEY = "tees_pending_payment";
const PAYMENT_POLL_INTERVAL_MS = 5000;
const PAYMENT_TROUBLESHOOTING_THRESHOLD_SECONDS = 45;

type SubmittedPayment = {
  amount: number;
  network: string;
  orderId: string;
  paymentStatus: string;
  phoneNumber: string;
  phase: DcmPaymentPhase;
  providerMessage: string;
  reference: string;
  startedAt: number;
};

type CheckoutErrorContextBody = {
  error?: string;
  message?: string;
};

type CheckoutError = Error & {
  context?: {
    json?: (() => Promise<CheckoutErrorContextBody>) | CheckoutErrorContextBody;
  };
};

function readSubmittedPayment() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = sessionStorage.getItem(PENDING_PAYMENT_KEY);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<SubmittedPayment>;
    if (!parsedValue.orderId || !parsedValue.phoneNumber || !parsedValue.network) {
      sessionStorage.removeItem(PENDING_PAYMENT_KEY);
      return null;
    }

    const phase =
      parsedValue.phase === "completed"
        ? "completed"
        : parsedValue.phase === "failed"
          ? "failed"
          : "pending";

    return {
      amount: Number(parsedValue.amount ?? 0),
      network: String(parsedValue.network),
      orderId: String(parsedValue.orderId),
      paymentStatus: String(parsedValue.paymentStatus ?? "initiated"),
      phoneNumber: String(parsedValue.phoneNumber),
      phase,
      providerMessage: String(parsedValue.providerMessage ?? ""),
      reference: String(parsedValue.reference ?? ""),
      startedAt:
        typeof parsedValue.startedAt === "number" && Number.isFinite(parsedValue.startedAt)
          ? parsedValue.startedAt
          : Date.now(),
    } satisfies SubmittedPayment;
  } catch {
    sessionStorage.removeItem(PENDING_PAYMENT_KEY);
    return null;
  }
}

function persistSubmittedPayment(payment: SubmittedPayment | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!payment) {
    sessionStorage.removeItem(PENDING_PAYMENT_KEY);
    return;
  }

  sessionStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(payment));
}

function formatOrderCode(orderId: string) {
  return orderId.slice(0, 8).toUpperCase();
}

function formatElapsedTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function maskPhoneNumber(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.length <= 4) {
    return phoneNumber;
  }

  const visiblePrefix = digits.slice(0, 3);
  const visibleSuffix = digits.slice(-3);
  const hiddenCount = Math.max(digits.length - 6, 3);
  return `${visiblePrefix}${"*".repeat(hiddenCount)}${visibleSuffix}`;
}

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [submittedPayment, setSubmittedPayment] = useState<SubmittedPayment | null>(() =>
    readSubmittedPayment()
  );

  const [formData, setFormData] = useState({
    customer_name: "",
    email: "",
    phone_number: "",
    shipping_address: "",
    shipping_city: "Accra",
    payment_network: NETWORKS[0].value,
  });

  const saveSubmittedPayment = (payment: SubmittedPayment | null) => {
    persistSubmittedPayment(payment);
    setSubmittedPayment(payment);
  };

  const clearSubmittedPayment = () => {
    saveSubmittedPayment(null);
  };

  const checkPaymentStatus = useCallback(async (payment: SubmittedPayment) => {
    setCheckingStatus(true);

    try {
      const snapshot = await getOrderPaymentSnapshot(payment.orderId);
      if (!snapshot) {
        return;
      }

      const nextPaymentStatus = String(snapshot.payment_status ?? payment.paymentStatus).trim() || "pending";
      const nextReference = String(snapshot.payment_reference ?? payment.reference).trim();
      const nextPhase = getPaymentPhaseFromStatus(nextPaymentStatus);

      if (
        nextPaymentStatus === payment.paymentStatus &&
        nextReference === payment.reference &&
        nextPhase === payment.phase
      ) {
        return;
      }

      saveSubmittedPayment({
        ...payment,
        paymentStatus: nextPaymentStatus,
        reference: nextReference,
        phase: nextPhase,
      });
    } catch (error) {
      console.error("Payment status polling failed:", error);
    } finally {
      setCheckingStatus(false);
    }
  }, []);

  useEffect(() => {
    if (!submittedPayment || submittedPayment.phase !== "pending") {
      setElapsedSeconds(0);
      return;
    }

    const updateElapsedSeconds = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - submittedPayment.startedAt) / 1000)));
    };

    updateElapsedSeconds();
    const timer = window.setInterval(updateElapsedSeconds, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [checkPaymentStatus, submittedPayment]);

  useEffect(() => {
    if (!submittedPayment || submittedPayment.phase !== "pending") {
      return;
    }

    let cancelled = false;

    const pollStatus = async () => {
      if (cancelled) {
        return;
      }

      await checkPaymentStatus(submittedPayment);
    };

    void pollStatus();
    const interval = window.setInterval(() => {
      void pollStatus();
    }, PAYMENT_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [checkPaymentStatus, submittedPayment]);

  if (submittedPayment) {
    const shortOrderCode = formatOrderCode(submittedPayment.orderId);
    const isPendingApproval = submittedPayment.phase === "pending";
    const isCompleted = submittedPayment.phase === "completed";
    const hasFailed = submittedPayment.phase === "failed";
    const showTroubleshooting =
      isPendingApproval && elapsedSeconds >= PAYMENT_TROUBLESHOOTING_THRESHOLD_SECONDS;

    return (
      <div className="container max-w-4xl mx-auto px-4 py-12 pt-24">
        <button
          onClick={() => {
            clearSubmittedPayment();
            navigate("/shop");
          }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          Continue shopping
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-border bg-secondary/20 p-8 md:p-10 space-y-8"
        >
          <div className="flex flex-col md:flex-row gap-5 md:items-start">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 ${
                isCompleted
                  ? "bg-emerald-500/10 text-emerald-700"
                  : hasFailed
                    ? "bg-red-500/10 text-red-700"
                    : "bg-amber-500/10 text-amber-700"
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-7 h-7" strokeWidth={1.75} />
              ) : hasFailed ? (
                <AlertTriangle className="w-7 h-7" strokeWidth={1.75} />
              ) : (
                <Loader2 className="w-7 h-7 animate-spin" strokeWidth={1.75} />
              )}
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                {isCompleted
                  ? "Payment Confirmed"
                  : hasFailed
                    ? "Payment Not Confirmed"
                    : "Waiting For Payment"}
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold uppercase tracking-wider">
                {isCompleted
                  ? "Payment received"
                  : hasFailed
                    ? "We could not confirm payment"
                    : "Approve the prompt on your phone"}
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl leading-6">
                {isCompleted
                  ? `Order ${shortOrderCode} has been marked as paid.`
                  : hasFailed
                    ? `Order ${shortOrderCode} was created, but the latest payment status is ${submittedPayment.paymentStatus}.`
                    : `Order ${shortOrderCode} has been created. We sent a mobile money request to ${maskPhoneNumber(
                        submittedPayment.phoneNumber
                      )} on ${submittedPayment.network}. This page keeps checking automatically while you approve the payment.`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-border bg-background/80 p-5 space-y-1.5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Order Code
              </p>
              <p className="text-lg font-semibold tracking-[0.2em]">{shortOrderCode}</p>
            </div>

            <div className="border border-border bg-background/80 p-5 space-y-1.5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Amount
              </p>
              <p className="text-lg font-semibold">GHC {submittedPayment.amount.toFixed(2)}</p>
            </div>

            <div className="border border-border bg-background/80 p-5 space-y-1.5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Network
              </p>
              <p className="text-base font-medium">{submittedPayment.network}</p>
            </div>

            <div className="border border-border bg-background/80 p-5 space-y-1.5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Wallet Number
              </p>
              <p className="text-base font-medium">{maskPhoneNumber(submittedPayment.phoneNumber)}</p>
            </div>
          </div>

          {isPendingApproval && (
            <div className="border border-border bg-background/80 p-5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Current Status
                  </p>
                  <p className="text-base font-medium capitalize">
                    {submittedPayment.paymentStatus || "pending"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Time Waiting
                  </p>
                  <p className="text-base font-medium">{formatElapsedTime(elapsedSeconds)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Payment request created and sent to the provider</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Loader2 className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
                  <span>Waiting for you to approve the mobile money prompt on your phone</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <RefreshCw
                    className={`w-4 h-4 shrink-0 ${checkingStatus ? "animate-spin text-foreground" : ""}`}
                  />
                  <span>
                    {checkingStatus
                      ? "Checking payment status..."
                      : "The page checks your order status automatically every few seconds"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {(submittedPayment.reference || submittedPayment.providerMessage) && (
            <div className="border border-border border-dashed bg-background/80 p-5 space-y-3">
              {submittedPayment.reference && (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Payment Reference
                  </p>
                  <p className="text-sm font-medium break-all">{submittedPayment.reference}</p>
                </div>
              )}
              {submittedPayment.providerMessage && (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Provider Response
                  </p>
                  <p className="text-sm text-muted-foreground leading-6">
                    {submittedPayment.providerMessage}
                  </p>
                </div>
              )}
            </div>
          )}

          {showTroubleshooting && (
            <div className="border border-border bg-background/80 p-5 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Still Waiting?
              </p>
              <p className="text-sm text-muted-foreground">
                Keep the phone unlocked and confirm the exact amount on the prompt before approving.
              </p>
              <p className="text-sm text-muted-foreground">
                If the prompt does not arrive, do not submit a second payment yet. Use order code{" "}
                <span className="font-medium text-foreground">{shortOrderCode}</span> when contacting
                support.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {isPendingApproval && (
              <Button
                onClick={() => void checkPaymentStatus(submittedPayment)}
                disabled={checkingStatus}
                className="rounded-none uppercase tracking-[0.18em]"
              >
                {checkingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking
                  </>
                ) : (
                  "Refresh Status"
                )}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate("/contact")}
              className="rounded-none uppercase tracking-[0.18em]"
            >
              Contact Support
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                clearSubmittedPayment();
                navigate("/shop");
              }}
              className="rounded-none uppercase tracking-[0.18em]"
            >
              Continue Shopping
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

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
    const digits = phone.replace(/\D/g, "");

    if (digits.startsWith("0")) {
      return "233" + digits.substring(1);
    }

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
      const orderId = await createOrder(
        localStorage.getItem("tees_cart_id"),
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

      const paymentResult = await initiateDcmPayment(
        normalizedPhone,
        totalPrice,
        formData.payment_network,
        orderId
      );

      console.log("Payment Result:", paymentResult);

      const paymentOutcome = getDcmPaymentOutcome(paymentResult);

      if (!paymentOutcome.accepted) {
        throw new Error(
          paymentOutcome.providerMessage ||
            paymentResult?.message ||
            paymentResult?.error ||
            "Payment request was not accepted. Please try again."
        );
      }

      await updateOrderPaymentState(orderId, paymentResult);

      saveSubmittedPayment({
        amount: totalPrice,
        network: formData.payment_network,
        orderId,
        paymentStatus: paymentOutcome.status,
        phoneNumber: normalizedPhone,
        phase: "pending",
        providerMessage: paymentOutcome.providerMessage,
        reference: paymentOutcome.reference,
        startedAt: Date.now(),
      });

      clearCart();
    } catch (error: unknown) {
      console.error("Checkout Error details:", error);
      const checkoutError = error as CheckoutError;
      let errorMessage = checkoutError.message || "Something went wrong. Please try again.";

      if (checkoutError.context && typeof checkoutError.context.json === "function") {
        try {
          const body = await checkoutError.context.json();
          errorMessage = body.message || body.error || errorMessage;
        } catch {
          // Ignore response parsing errors and keep the fallback message.
        }
      } else if (checkoutError.context?.json) {
        const body = checkoutError.context.json;
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-2xl font-semibold uppercase tracking-wider mb-2">Checkout</h1>
            <p className="text-sm text-muted-foreground font-light">
              Complete your order details below
            </p>
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
                * Use the number registered for mobile money. Approval prompts can take up to 60
                seconds.
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
                    <p className="text-sm font-semibold">
                      GHC {(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.size} /{" "}
                    {item.product.useDesignSelection
                      ? `Design: ${item.color}`
                      : `Color: ${item.color}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Qty: {item.quantity}</p>
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
