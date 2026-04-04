export type DcmPaymentResult = {
  success?: boolean;
  status?: string;
  message?: unknown;
  error?: unknown;
  responseCode?: string | number;
  paymentId?: string | number;
  nameEnquiryTransactionID?: string;
  collectionTransactionID?: string;
  data?: {
    nameEnquiry?: unknown;
    collection?: unknown;
  };
};

type DcmPaymentNode = {
  collectionTransactionID?: string | number;
  error?: unknown;
  message?: unknown;
  nameEnquiryTransactionID?: string;
  paymentId?: string | number;
  responseCode?: string | number;
  status?: string | number;
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

function asPaymentNode(value: unknown): DcmPaymentNode | null {
  return value && typeof value === "object" ? (value as DcmPaymentNode) : null;
}

function extractTextValue(value: unknown, depth = 0): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (!value || typeof value !== "object" || depth > 2) {
    return "";
  }

  const record = value as Record<string, unknown>;
  const priorityKeys = [
    "message",
    "error",
    "details",
    "description",
    "responseMessage",
    "statusText",
    "status",
  ];

  for (const key of priorityKeys) {
    const nestedText = extractTextValue(record[key], depth + 1);
    if (nestedText) {
      return nestedText;
    }
  }

  for (const nestedValue of Object.values(record)) {
    const nestedText = extractTextValue(nestedValue, depth + 1);
    if (nestedText) {
      return nestedText;
    }
  }

  return "";
}

function getPaymentNodes(paymentResult: DcmPaymentResult) {
  const collectionNode = asPaymentNode(paymentResult.data?.collection);
  const topLevelNode = asPaymentNode(paymentResult);
  const nameEnquiryNode = asPaymentNode(paymentResult.data?.nameEnquiry);

  return [collectionNode, topLevelNode, nameEnquiryNode].filter(
    (node): node is DcmPaymentNode => Boolean(node)
  );
}

export function getDcmPaymentReference(paymentResult: DcmPaymentResult) {
  for (const node of getPaymentNodes(paymentResult)) {
    const reference = String(
      node.collectionTransactionID ?? node.nameEnquiryTransactionID ?? node.paymentId ?? ""
    ).trim();

    if (reference) {
      return reference;
    }
  }

  return "";
}

export function getDcmProviderMessage(paymentResult: DcmPaymentResult) {
  for (const node of getPaymentNodes(paymentResult)) {
    const message = extractTextValue(node.message) || extractTextValue(node.error);
    if (message) {
      return message;
    }
  }

  return "";
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
  const statuses = getPaymentNodes(paymentResult)
    .map((node) => normalizeValue(node.status))
    .filter(Boolean);
  const rawStatus = statuses[0] ?? "";
  const responseCodes = getPaymentNodes(paymentResult)
    .map((node) => String(node.responseCode ?? "").trim())
    .filter(Boolean);
  const providerMessage = getDcmProviderMessage(paymentResult);
  const reference = getDcmPaymentReference(paymentResult);

  const hasAcceptedPendingStatus = statuses.some((status) => ACCEPTED_PENDING_STATUSES.has(status));
  const hasCompletedStatus = statuses.some((status) => COMPLETED_STATUSES.has(status));
  const hasFailedStatus = statuses.some((status) => FAILED_STATUSES.has(status));
  const hasPositiveMessage = POSITIVE_MESSAGE_PATTERN.test(providerMessage);
  const hasStrongPositiveMessage = STRONG_POSITIVE_MESSAGE_PATTERN.test(providerMessage);
  const hasNegativeMessage = NEGATIVE_MESSAGE_PATTERN.test(providerMessage);
  const hasSuccessCode = responseCodes.some((responseCode) => responseCode === "000");
  const hasPositiveSignals =
    hasAcceptedPendingStatus ||
    hasCompletedStatus ||
    hasSuccessCode ||
    paymentResult.success === true ||
    hasStrongPositiveMessage ||
    Boolean(reference && hasPositiveMessage);
  const hasNegativeSignals = hasFailedStatus || hasNegativeMessage || paymentResult.success === false;

  if (hasNegativeSignals && !hasPositiveSignals) {
    return {
      accepted: false,
      phase: "failed",
      status: rawStatus || "failed",
      reference,
      providerMessage,
    };
  }

  if (hasPositiveSignals) {
    const positiveStatus = statuses.find((status) => ACCEPTED_PENDING_STATUSES.has(status));
    const pendingStatus =
      positiveStatus && NORMALIZED_PENDING_STATUSES.has(positiveStatus)
        ? positiveStatus
        : "initiated";

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
