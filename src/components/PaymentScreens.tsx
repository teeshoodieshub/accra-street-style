import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PAYMENT_TROUBLESHOOTING_THRESHOLD_SECONDS,
  formatElapsedTime,
  formatOrderCode,
  maskPhoneNumber,
  type SubmittedPayment,
} from "@/lib/paymentSession";

export type PaymentSubmissionPreview = {
  amount: number;
  network: string;
  phoneNumber: string;
};

export function PaymentSubmissionScreen({ payment }: { payment: PaymentSubmissionPreview }) {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-10">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl overflow-hidden border border-border bg-secondary/20"
      >
        <div className="border-b border-border bg-background/80 px-6 py-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Payment Loading Screen
          </p>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-8 px-6 py-8 md:px-10 md:py-12">
            <div className="space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-700">
                <Loader2 className="h-7 w-7 animate-spin" strokeWidth={1.8} />
              </div>
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  Connecting To Mobile Money
                </p>
                <h1 className="text-3xl font-semibold uppercase tracking-[0.16em] leading-tight">
                  Sending your payment prompt
                </h1>
                <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                  We are preparing your order and sending the approval request to your wallet. Keep
                  your phone nearby and unlocked.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="h-1.5 overflow-hidden bg-border/70">
                <motion.div
                  className="h-full bg-foreground"
                  initial={{ x: "-100%" }}
                  animate={{ x: ["-100%", "0%", "100%"] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                <div className="border border-border bg-background/80 p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em]">Step 1</p>
                  <p className="mt-2 text-foreground">Preparing order</p>
                </div>
                <div className="border border-border bg-background/80 p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em]">Step 2</p>
                  <p className="mt-2 text-foreground">Sending wallet prompt</p>
                </div>
                <div className="border border-border bg-background/80 p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em]">Step 3</p>
                  <p className="mt-2 text-foreground">Waiting for approval</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="border-t border-border bg-background/80 px-6 py-8 md:px-8 lg:border-l lg:border-t-0">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Payment Details
            </p>
            <div className="mt-6 space-y-5">
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Amount
                </p>
                <p className="text-2xl font-semibold">GHC {payment.amount.toFixed(2)}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Network
                </p>
                <p className="text-base font-medium">{payment.network}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Wallet Number
                </p>
                <p className="text-base font-medium">{maskPhoneNumber(payment.phoneNumber)}</p>
              </div>
            </div>
          </aside>
        </div>
      </motion.section>
    </div>
  );
}

type PaymentStatusScreenProps = {
  canRetryPayment: boolean;
  checkingStatus: boolean;
  elapsedSeconds: number;
  onContactSupport: () => void;
  onContinueShopping: () => void;
  onRefreshStatus: () => void;
  onRetryPayment: () => void;
  payment: SubmittedPayment;
  retryingPayment: boolean;
};

export function PaymentStatusScreen({
  canRetryPayment,
  checkingStatus,
  elapsedSeconds,
  onContactSupport,
  onContinueShopping,
  onRefreshStatus,
  onRetryPayment,
  payment,
  retryingPayment,
}: PaymentStatusScreenProps) {
  const shortOrderCode = formatOrderCode(payment.orderId);
  const isPendingApproval = payment.phase === "pending";
  const isCompleted = payment.phase === "completed";
  const hasFailed = payment.phase === "failed";
  const showTroubleshooting =
    isPendingApproval && elapsedSeconds >= PAYMENT_TROUBLESHOOTING_THRESHOLD_SECONDS;

  const accentStyles = isCompleted
    ? "bg-emerald-500/10 text-emerald-700"
    : hasFailed
      ? "bg-red-500/10 text-red-700"
      : "bg-amber-500/10 text-amber-700";

  return (
    <div className="min-h-[calc(100vh-5rem)] px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={onContinueShopping}
          className="mb-8 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Continue shopping
        </button>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden border border-border bg-secondary/20"
        >
          <div className="border-b border-border bg-background/70 px-6 py-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Payment Status
            </p>
          </div>

          <div className="grid gap-0 xl:grid-cols-[1.25fr_0.95fr]">
            <div className="space-y-8 px-6 py-8 md:px-10 md:py-10">
              <div className="flex flex-col gap-5 md:flex-row md:items-start">
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${accentStyles}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-7 w-7" strokeWidth={1.75} />
                  ) : hasFailed ? (
                    <AlertTriangle className="h-7 w-7" strokeWidth={1.75} />
                  ) : (
                    <Loader2 className="h-7 w-7 animate-spin" strokeWidth={1.75} />
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    {isCompleted
                      ? "Payment Confirmed"
                      : hasFailed
                        ? "Payment Not Confirmed"
                        : "Waiting For Approval"}
                  </p>
                  <h1 className="text-3xl font-semibold uppercase tracking-[0.14em] leading-tight">
                    {isCompleted
                      ? "Payment received"
                      : hasFailed
                        ? "We could not confirm payment"
                        : "Approve the prompt on your phone"}
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    {isCompleted
                      ? `Order ${shortOrderCode} has been marked as paid and your checkout is complete.`
                      : hasFailed
                        ? `Order ${shortOrderCode} was created, but the latest payment status is ${payment.paymentStatus}. You can retry the payment on this order or contact support with the order code.`
                        : `Order ${shortOrderCode} has been created. We sent a mobile money request to ${maskPhoneNumber(
                            payment.phoneNumber
                          )} on ${payment.network}. This screen keeps checking automatically while you approve the payment.`}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="border border-border bg-background/80 p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Order Code
                  </p>
                  <p className="mt-2 text-lg font-semibold tracking-[0.2em]">{shortOrderCode}</p>
                </div>
                <div className="border border-border bg-background/80 p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Amount
                  </p>
                  <p className="mt-2 text-lg font-semibold">GHC {payment.amount.toFixed(2)}</p>
                </div>
                <div className="border border-border bg-background/80 p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Network
                  </p>
                  <p className="mt-2 text-base font-medium">{payment.network}</p>
                </div>
                <div className="border border-border bg-background/80 p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Wallet Number
                  </p>
                  <p className="mt-2 text-base font-medium">
                    {maskPhoneNumber(payment.phoneNumber)}
                  </p>
                </div>
              </div>

              {(payment.reference || payment.providerMessage) && (
                <div className="space-y-4 border border-dashed border-border bg-background/80 p-5">
                  {payment.reference && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Payment Reference
                      </p>
                      <p className="break-all text-sm font-medium">{payment.reference}</p>
                    </div>
                  )}
                  {payment.providerMessage && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Provider Response
                      </p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {payment.providerMessage}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {showTroubleshooting && (
                <div className="space-y-2 border border-border bg-background/80 p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Still Waiting?
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Keep the phone unlocked and confirm the exact amount on the prompt before
                    approving.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    If the prompt does not arrive, do not submit a second payment yet. Use order
                    code <span className="font-medium text-foreground">{shortOrderCode}</span> when
                    contacting support.
                  </p>
                </div>
              )}
            </div>

            <aside className="border-t border-border bg-background/80 px-6 py-8 md:px-8 xl:border-l xl:border-t-0">
              <div className="space-y-5">
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Live Status
                  </p>
                  <div className="space-y-4 border border-border bg-secondary/30 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          Current Status
                        </p>
                        <p className="mt-2 text-base font-medium capitalize">
                          {payment.paymentStatus || "pending"}
                        </p>
                      </div>
                      {isPendingApproval && (
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            Time Waiting
                          </p>
                          <p className="mt-2 text-base font-medium">
                            {formatElapsedTime(elapsedSeconds)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span>Order created successfully</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        ) : hasFailed ? (
                          <AlertTriangle className="h-4 w-4 shrink-0 text-red-700" />
                        ) : (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-600" />
                        )}
                        <span>
                          {isCompleted
                            ? "Payment approved and confirmed"
                            : hasFailed
                              ? "Payment was not approved or could not be confirmed"
                              : "Waiting for your wallet approval"}
                        </span>
                      </div>
                      {isPendingApproval && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <RefreshCw
                            className={`h-4 w-4 shrink-0 ${checkingStatus ? "animate-spin text-foreground" : ""}`}
                          />
                          <span>
                            {checkingStatus
                              ? "Checking payment status..."
                              : "This screen refreshes payment status automatically every few seconds for up to 2 minutes"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {isPendingApproval && (
                    <Button
                      onClick={onRefreshStatus}
                      disabled={checkingStatus}
                      className="rounded-none uppercase tracking-[0.18em]"
                    >
                      {checkingStatus ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Checking
                        </>
                      ) : (
                        "Refresh Status"
                      )}
                    </Button>
                  )}
                  {hasFailed && canRetryPayment && (
                    <Button
                      onClick={onRetryPayment}
                      disabled={retryingPayment}
                      className="rounded-none uppercase tracking-[0.18em]"
                    >
                      {retryingPayment ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Resending Prompt
                        </>
                      ) : (
                        "Retry Payment For This Order"
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={onContactSupport}
                    className="rounded-none uppercase tracking-[0.18em]"
                  >
                    Contact Support
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onContinueShopping}
                    className="rounded-none uppercase tracking-[0.18em]"
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
