import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { Resend } from "npm:resend@3.2.0"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))
const adminEmail = Deno.env.get("ADMIN_EMAIL") || "admin@teesandhoodies.com"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const record = payload.record // Triggered by Webhook on the 'custom_orders' table

    if (!record) {
      throw new Error("No record found in payload")
    }

    const {
      customer_name,
      email,
      phone_number,
      product_type,
      quantity,
      delivery_location,
      print_placement
    } = record

    // Send email to business admin
    const adminResponse = await resend.emails.send({
      from: 'Tees & Hoodies Orders <orders@teesandhoodies.com>',
      to: adminEmail,
      subject: `New Custom Order: ${quantity}x ${product_type} for ${customer_name}`,
      html: `
        <h2>New Custom Order Received</h2>
        <p><strong>Customer:</strong> ${customer_name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone_number}</p>
        <p><strong>Product:</strong> ${quantity}x ${product_type}</p>
        <p><strong>Location:</strong> ${delivery_location}</p>
        <p><strong>Placement:</strong> ${print_placement}</p>
        <p>Log in to the Supabase Admin Portal or the Store Dashboard to view full details and print files.</p>
      `
    })

    // Send confirmation to customer
    const userResponse = await resend.emails.send({
      from: 'Tees & Hoodies <hello@teesandhoodies.com>',
      to: email,
      subject: `Your Tees & Hoodies Custom Order is Received!`,
      html: `
        <h2>Order Received, ${customer_name}!</h2>
        <p>Thank you for placing a custom apparel print order with Tees & Hoodies.</p>
        <p>We are currently reviewing your request for ${quantity}x ${product_type}. Our team will get back to you shortly (usually within 24 hours) with a quotation and timeline to proceed.</p>
        <br />
        <p>Best regards,<br>The Tees & Hoodies Team</p>
      `
    })

    return new Response(
      JSON.stringify({ adminResponse, userResponse }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      },
    )
  } catch (error: any) {
    console.error("Webhook processing error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      },
    )
  }
})
