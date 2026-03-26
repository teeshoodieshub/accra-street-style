import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const DCM_PAYMENT_API_URL =
  Deno.env.get("PAYMENT_API_URL") ||
  Deno.env.get("DCM_PAYMENT_API_URL") ||
  "http://54.86.149.215/pay";
const DCM_PARTNER_CODE = Deno.env.get("DCM_PARTNER_CODE") || "MSH";

const NETWORK_NAMES: Record<string, string> = {
  mtn: "MTN",
  airteltigo: "AirtelTigo",
  telecel: "Telecel",
};

function formatOrderNarration(orderId: string | undefined) {
  const shortOrderId = String(orderId ?? "").trim().slice(0, 8).toUpperCase();
  return shortOrderId ? `Order ${shortOrderId}` : "Order payment";
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { accountNumber, amount, narration, network, orderId } = await req.json();

    if (!accountNumber || !amount || !network) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const normalizedNetworkInput = String(network).trim().toLowerCase();
    const mappedNetwork = NETWORK_NAMES[normalizedNetworkInput] || String(network).trim();

    const payload = {
      accountNumber,
      amount: amount.toString(),
      narration: narration || formatOrderNarration(orderId),
      network: mappedNetwork,
      partnerCode: DCM_PARTNER_CODE,
    };

    console.log("Calling DCM API:", DCM_PAYMENT_API_URL, payload);

    const response = await fetch(DCM_PAYMENT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    let result;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      result = await response.json();
    } else {
      result = { message: await response.text() };
    }

    console.log("DCM API Response:", result);

    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error: unknown) {
    console.error("Error in pay-dcm function:", error);
    const message = error instanceof Error ? error.message : "Unknown payment error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
