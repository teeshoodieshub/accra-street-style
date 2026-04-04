import type { DcmPaymentPhase } from "@/lib/dcmPayment";

export const PENDING_PAYMENT_KEY = "tees_pending_payment";
export const PAYMENT_POLL_INTERVAL_MS = 5000;
export const PAYMENT_TROUBLESHOOTING_THRESHOLD_SECONDS = 45;
export const PAYMENT_TIMEOUT_SECONDS = 120;

export type SubmittedPayment = {
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

export function readSubmittedPayment() {
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

export function persistSubmittedPayment(payment: SubmittedPayment | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!payment) {
    sessionStorage.removeItem(PENDING_PAYMENT_KEY);
    return;
  }

  sessionStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(payment));
}

export function clearSubmittedPayment() {
  persistSubmittedPayment(null);
}

export function formatOrderCode(orderId: string) {
  return orderId.slice(0, 8).toUpperCase();
}

export function formatElapsedTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

export function maskPhoneNumber(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.length <= 4) {
    return phoneNumber;
  }

  const visiblePrefix = digits.slice(0, 3);
  const visibleSuffix = digits.slice(-3);
  const hiddenCount = Math.max(digits.length - 6, 3);
  return `${visiblePrefix}${"*".repeat(hiddenCount)}${visibleSuffix}`;
}
