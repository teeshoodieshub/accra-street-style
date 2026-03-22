import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Resend } from "npm:resend@3.2.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const statusLabel = (value: string) => value?.trim() || "Updated";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      orderType,
      orderId,
      status,
      previousStatus,
      customerName,
      customerEmail,
    } = await req.json();

    if (!orderId || !status || !customerEmail) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const typeLabel = orderType === "custom" ? "Custom Print" : "Store";
    const nextStatus = statusLabel(status);
    const prevStatus = previousStatus ? statusLabel(previousStatus) : null;
    const greetingName = customerName?.trim() || "there";

    const subject = `Order Update (${typeLabel}): ${nextStatus}`;
    const transitionText = prevStatus
      ? `${prevStatus} -> ${nextStatus}`
      : nextStatus;

    const response = await resend.emails.send({
      from: "Tees & Hoodies <hello@teesandhoodies.com>",
      to: customerEmail,
      subject,
      html: `
        <h2>Your order status has changed</h2>
        <p>Hi ${greetingName},</p>
        <p>Your ${typeLabel.toLowerCase()} order <strong>#${orderId.slice(0, 8)}</strong> is now <strong>${nextStatus}</strong>.</p>
        <p><strong>Status timeline:</strong> ${transitionText}</p>
        <p>If you have any questions, reply to this email and our team will help.</p>
        <br />
        <p>Best regards,<br/>Tees & Hoodies</p>
      `,
    });

    return new Response(JSON.stringify({ ok: true, response }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("notify-order-status error:", error);
    return new Response(JSON.stringify({ error: error.message || "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
