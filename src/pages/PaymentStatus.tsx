import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  PaymentStatusScreen,
  PaymentSubmissionScreen,
} from "@/components/PaymentScreens";
import {
  clearSubmittedPayment,
  PAYMENT_POLL_INTERVAL_MS,
  PAYMENT_TIMEOUT_SECONDS,
  persistSubmittedPayment,
  readSubmittedPayment,
  type SubmittedPayment,
} from "@/lib/paymentSession";
import {
  getDcmPaymentOutcome,
  getOrderPaymentSnapshot,
  initiateDcmPayment,
  setOrderPaymentSnapshot,
  updateOrderPaymentState,
} from "@/lib/supabaseApi";
import { getPaymentPhaseFromStatus } from "@/lib/dcmPayment";

type PaymentErrorContextBody = {
  error?: string;
  message?: string;
};

type PaymentError = Error & {
  context?: {
    json?: (() => Promise<PaymentErrorContextBody>) | PaymentErrorContextBody;
  };
};

async function getPaymentErrorMessage(error: unknown) {
  const paymentError = error as PaymentError;
  let errorMessage = paymentError.message || "Something went wrong. Please try again.";

  if (paymentError.context && typeof paymentError.context.json === "function") {
    try {
      const body = await paymentError.context.json();
      errorMessage = body.message || body.error || errorMessage;
    } catch {
      // Keep the fallback message when response parsing fails.
    }
  } else if (paymentError.context?.json) {
    const body = paymentError.context.json;
    errorMessage = body.message || body.error || errorMessage;
  }

  return errorMessage;
}

export default function PaymentStatus() {
  const navigate = useNavigate();
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [submittedPayment, setSubmittedPayment] = useState<SubmittedPayment | null>(() =>
    readSubmittedPayment()
  );

  const saveSubmittedPayment = (payment: SubmittedPayment | null) => {
    persistSubmittedPayment(payment);
    setSubmittedPayment(payment);
  };

  const clearPaymentSession = () => {
    clearSubmittedPayment();
    setSubmittedPayment(null);
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

  const retryPaymentForOrder = useCallback(async () => {
    if (!submittedPayment || submittedPayment.phase !== "failed") {
      return;
    }

    setRetryingPayment(true);

    try {
      const paymentResult = await initiateDcmPayment(
        submittedPayment.phoneNumber,
        submittedPayment.amount,
        submittedPayment.network,
        submittedPayment.orderId
      );

      const paymentOutcome = getDcmPaymentOutcome(paymentResult);
      await updateOrderPaymentState(submittedPayment.orderId, paymentResult);

      saveSubmittedPayment({
        ...submittedPayment,
        paymentStatus: paymentOutcome.status,
        phase: paymentOutcome.phase,
        providerMessage: paymentOutcome.providerMessage,
        reference: paymentOutcome.reference,
        startedAt: Date.now(),
      });

      toast({
        title: paymentOutcome.accepted ? "Payment Request Resent" : "Payment Retry Failed",
        description: paymentOutcome.accepted
          ? "A new mobile money prompt has been sent to your wallet."
          : paymentOutcome.providerMessage || "We could not resend the payment prompt.",
        variant: paymentOutcome.accepted ? undefined : "destructive",
      });
    } catch (error) {
      console.error("Payment retry failed:", error);
      const errorMessage = await getPaymentErrorMessage(error);

      saveSubmittedPayment({
        ...submittedPayment,
        paymentStatus: "failed",
        phase: "failed",
        providerMessage: errorMessage,
        reference: "",
        startedAt: Date.now(),
      });

      toast({
        title: "Payment Retry Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setRetryingPayment(false);
    }
  }, [submittedPayment]);

  useEffect(() => {
    if (!submittedPayment || submittedPayment.phase !== "failed") {
      return;
    }

    const inferredOutcome = getDcmPaymentOutcome({
      status: submittedPayment.paymentStatus,
      message: submittedPayment.providerMessage,
      collectionTransactionID: submittedPayment.reference,
    });

    if (!inferredOutcome.accepted) {
      return;
    }

    const reconciledPayment = {
      ...submittedPayment,
      paymentStatus: inferredOutcome.status,
      phase: inferredOutcome.phase,
      reference: inferredOutcome.reference || submittedPayment.reference,
      startedAt: Date.now(),
    };

    saveSubmittedPayment(reconciledPayment);

    void setOrderPaymentSnapshot(
      submittedPayment.orderId,
      reconciledPayment.paymentStatus,
      reconciledPayment.reference
    );
  }, [submittedPayment]);

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
  }, [submittedPayment]);

  useEffect(() => {
    if (
      !submittedPayment ||
      submittedPayment.phase !== "pending" ||
      elapsedSeconds < PAYMENT_TIMEOUT_SECONDS
    ) {
      return;
    }

    const timedOutPayment: SubmittedPayment = {
      ...submittedPayment,
      paymentStatus: "failed",
      phase: "failed",
      providerMessage:
        "Payment confirmation was not received within 2 minutes. This payment attempt has been marked as failed.",
    };

    saveSubmittedPayment(timedOutPayment);

    void setOrderPaymentSnapshot(
      submittedPayment.orderId,
      timedOutPayment.paymentStatus,
      timedOutPayment.reference
    );

    toast({
      title: "Payment Timed Out",
      description:
        "No confirmation arrived within 2 minutes, so this payment attempt has been marked as failed.",
      variant: "destructive",
    });
  }, [elapsedSeconds, submittedPayment]);

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

  if (!submittedPayment) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <ShoppingBag className="mb-4 h-12 w-12 text-muted-foreground" strokeWidth={1} />
        <h2 className="mb-3 text-xl font-medium uppercase tracking-widest">
          No payment is being tracked
        </h2>
        <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
          Start a new checkout session to create an order and track its payment status here.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => navigate("/checkout")}>Go To Checkout</Button>
          <Button onClick={() => navigate("/shop")} variant="outline">
            Return To Shop
          </Button>
        </div>
      </div>
    );
  }

  if (retryingPayment) {
    return (
      <PaymentSubmissionScreen
        payment={{
          amount: submittedPayment.amount,
          network: submittedPayment.network,
          phoneNumber: submittedPayment.phoneNumber,
        }}
      />
    );
  }

  return (
    <PaymentStatusScreen
      canRetryPayment
      checkingStatus={checkingStatus}
      elapsedSeconds={elapsedSeconds}
      onContactSupport={() => navigate("/contact")}
      onContinueShopping={() => {
        clearPaymentSession();
        navigate("/shop");
      }}
      onRefreshStatus={() => void checkPaymentStatus(submittedPayment)}
      onRetryPayment={() => void retryPaymentForOrder()}
      payment={submittedPayment}
      retryingPayment={retryingPayment}
    />
  );
}
