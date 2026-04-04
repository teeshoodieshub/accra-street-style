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

  it("treats contradictory failed status plus strong success response as pending", () => {
    const outcome = getDcmPaymentOutcome({
      status: "failed",
      message: "Payment processed successfully",
      collectionTransactionID: "MSH-1775302145447",
    });

    expect(outcome).toMatchObject({
      accepted: true,
      phase: "pending",
      status: "initiated",
      reference: "MSH-1775302145447",
      providerMessage: "Payment processed successfully",
    });
  });

  it("prefers nested collection success data over conflicting top-level failure", () => {
    const outcome = getDcmPaymentOutcome({
      status: "failed",
      message: "Request failed",
      data: {
        collection: {
          status: "success",
          message: "Collection request submitted",
          responseCode: "000",
          collectionTransactionID: "nested-123",
        },
      },
    });

    expect(outcome).toMatchObject({
      accepted: true,
      phase: "pending",
      status: "initiated",
      reference: "nested-123",
      providerMessage: "Collection request submitted",
    });
  });

  it("extracts readable provider text from object messages", () => {
    const outcome = getDcmPaymentOutcome({
      status: "success",
      message: {
        message: "Payment processed successfully",
      },
      collectionTransactionID: "obj-001",
    });

    expect(outcome).toMatchObject({
      accepted: true,
      phase: "pending",
      status: "initiated",
      reference: "obj-001",
      providerMessage: "Payment processed successfully",
    });
  });

  it("maps stored order payment statuses to their display phase", () => {
    expect(getPaymentPhaseFromStatus("completed")).toBe("completed");
    expect(getPaymentPhaseFromStatus("failed")).toBe("failed");
    expect(getPaymentPhaseFromStatus("initiated")).toBe("pending");
  });
});
