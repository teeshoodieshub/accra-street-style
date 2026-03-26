export type DcmPaymentResult = {
  success?: boolean;
  status?: string;
  message?: string;
  error?: string;
  responseCode?: string | number;
  paymentId?: string | number;
  nameEnquiryTransactionID?: string;
  collectionTransactionID?: string;
  data?: {
    nameEnquiry?: unknown;
    collection?: unknown;
  };
};

export type DcmPaymentPhase = "pending" | "completed" | "failed";

export type DcmPaymentOutcome = {
  accepted: boolean;
  phase: DcmPaymentPhase;
  status: string;
  reference: string;
  providerMessage: string;
};

const ACCEPTED_PENDING_STATUSES = new Set([
  "success",
  "approved",
  "pending",
  "processing",
  "initiated",
  "queued",
  "submitted",
]);
const NORMALIZED_PENDING_STATUSES = new Set(["pending", "processing", "initiated", "queued", "submitted"]);
const FAILED_STATUSES = new Set([
  "failed",
  "rejected",
  "declined",
  "cancelled",
  "canceled",
  "expired",
  "error",
  "timeout",
]);
const COMPLETED_STATUSES = new Set(["completed", "paid", "settled", "successful"]);
const POSITIVE_MESSAGE_PATTERN =
  /\b(success|successful|approved|pending|processing|initiated|queued|submitted|sent)\b/i;
const STRONG_POSITIVE_MESSAGE_PATTERN =
  /(payment processed successfully|payment successful|request accepted|request submitted|collection request submitted)/i;
const NEGATIVE_MESSAGE_PATTERN =
  /\b(fail(?:ed|ure)?|error|declin(?:e|ed)|reject(?:ed)?|cancel(?:ed|led)?|expire(?:d)?|timeout|invalid)\b/i;

function normalizeValue(value: string | number | undefined | null) {
  return String(value ?? "").trim().toLowerCase();
}

export function getDcmPaymentReference(paymentResult: DcmPaymentResult) {
  return String(
    paymentResult.collectionTransactionID ??
      paymentResult.nameEnquiryTransactionID ??
      paymentResult.paymentId ??
      ""
  ).trim();
}

export function getDcmProviderMessage(paymentResult: DcmPaymentResult) {
  return String(paymentResult.message ?? paymentResult.error ?? "").trim();
}

export function getPaymentPhaseFromStatus(status: string | undefined | null): DcmPaymentPhase {
  const normalizedStatus = normalizeValue(status);

  if (FAILED_STATUSES.has(normalizedStatus)) {
    return "failed";
  }

  if (COMPLETED_STATUSES.has(normalizedStatus)) {
    return "completed";
  }

  return "pending";
}

export function getDcmPaymentOutcome(paymentResult: DcmPaymentResult): DcmPaymentOutcome {
  const rawStatus = normalizeValue(paymentResult.status);
  const responseCode = String(paymentResult.responseCode ?? "").trim();
  const providerMessage = getDcmProviderMessage(paymentResult);
  const reference = getDcmPaymentReference(paymentResult);

  const hasAcceptedPendingStatus = ACCEPTED_PENDING_STATUSES.has(rawStatus);
  const hasFailedStatus = FAILED_STATUSES.has(rawStatus);
  const hasPositiveMessage = POSITIVE_MESSAGE_PATTERN.test(providerMessage);
  const hasStrongPositiveMessage = STRONG_POSITIVE_MESSAGE_PATTERN.test(providerMessage);
  const hasNegativeMessage = NEGATIVE_MESSAGE_PATTERN.test(providerMessage);
  const hasSuccessCode = responseCode === "000";

  if (hasFailedStatus || hasNegativeMessage || paymentResult.success === false) {
    return {
      accepted: false,
      phase: "failed",
      status: rawStatus || "failed",
      reference,
      providerMessage,
    };
  }

  if (
    hasAcceptedPendingStatus ||
    COMPLETED_STATUSES.has(rawStatus) ||
    hasSuccessCode ||
    paymentResult.success === true ||
    hasStrongPositiveMessage ||
    (reference && hasPositiveMessage)
  ) {
    const pendingStatus =
      rawStatus && NORMALIZED_PENDING_STATUSES.has(rawStatus) ? rawStatus : "initiated";

    return {
      accepted: true,
      phase: "pending",
      status: pendingStatus,
      reference,
      providerMessage,
    };
  }

  return {
    accepted: false,
    phase: "failed",
    status: rawStatus || "failed",
    reference,
    providerMessage,
  };
}
