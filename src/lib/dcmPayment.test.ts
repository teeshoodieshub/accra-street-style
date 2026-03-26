import { describe, expect, it } from "vitest";
import { getDcmPaymentOutcome, getPaymentPhaseFromStatus } from "@/lib/dcmPayment";

describe("getDcmPaymentOutcome", () => {
  it("treats successful initiation responses as pending approval", () => {
    const outcome = getDcmPaymentOutcome({
      success: true,
      status: "success",
      message: "Collection request submitted",
      collectionTransactionID: "abc-123",
    });

    expect(outcome).toMatchObject({
      accepted: true,
      phase: "pending",
      status: "initiated",
      reference: "abc-123",
    });
  });

  it("treats provider completed text as pending until the stored order status confirms it", () => {
    const outcome = getDcmPaymentOutcome({
      status: "completed",
      message: "Payment completed successfully",
      collectionTransactionID: "paid-456",
    });

    expect(outcome).toMatchObject({
      accepted: true,
      phase: "pending",
      status: "initiated",
      reference: "paid-456",
    });
  });

  it("rejects failed responses even when a reference exists", () => {
    const outcome = getDcmPaymentOutcome({
      status: "failed",
      message: "Payment failed: insufficient funds",
      collectionTransactionID: "ref-789",
    });

    expect(outcome).toMatchObject({
      accepted: false,
      phase: "failed",
      status: "failed",
      reference: "ref-789",
    });
  });

  it("accepts success-code responses as pending when completion is not explicit", () => {
    const outcome = getDcmPaymentOutcome({
      responseCode: "000",
      message: "Request accepted by provider",
    });

    expect(outcome).toMatchObject({
      accepted: true,
      phase: "pending",
      status: "initiated",
      reference: "",
    });
  });

  it("accepts strong success messages even when the provider omits a reference", () => {
    const outcome = getDcmPaymentOutcome({
      message: "Payment processed successfully",
    });

    expect(outcome).toMatchObject({
      accepted: true,
      phase: "pending",
      status: "initiated",
      reference: "",
    });
  });

  it("maps stored order payment statuses to their display phase", () => {
    expect(getPaymentPhaseFromStatus("completed")).toBe("completed");
    expect(getPaymentPhaseFromStatus("failed")).toBe("failed");
    expect(getPaymentPhaseFromStatus("initiated")).toBe("pending");
  });
});
