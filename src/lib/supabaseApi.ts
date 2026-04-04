import { supabase } from "@/lib/supabase";
import {
  getDcmPaymentOutcome,
  type DcmPaymentResult,
} from "@/lib/dcmPayment";
import type { Product } from "@/data/products";

export { getDcmPaymentOutcome } from "@/lib/dcmPayment";

type DbProduct = {
  id: string;
  name: string;
  price: number;
  category: string;
  featured_image_url: string | null;
  image_urls: string[];
  use_design_selection: boolean | null;
  colors: string[];
  sizes: string[];
  description: string;
  specs: string;
  is_new: boolean | null;
  is_featured: boolean | null;
};

export type DbCategory = {
  id: string;
  name: string;
  description: string | null;
  image_url?: string | null;
  sort_order?: number;
  created_at: string;
};

export type DbHeroImage = {
  id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
};

export type DbCartItem = {
  quantity: number;
  size: string;
  color: string;
  product: DbProduct;
};

export type DbOrderItem = {
  size: string;
  color: string;
  quantity: number;
  unit_price: number;
  product: Pick<DbProduct, "id" | "name" | "image_urls">;
};

export type DbOrder = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  customer_name?: string;
  phone_number?: string;
  email?: string;
  shipping_address?: string;
  shipping_city?: string;
  payment_method?: string;
  payment_network?: string;
  payment_status?: string;
  order_items: DbOrderItem[];
};

export type OrderPaymentSnapshot = {
  payment_reference: string | null;
  payment_status: string | null;
};

export type { DcmPaymentResult } from "@/lib/dcmPayment";

export type DbCart = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  cart_items: Array<{
    size: string;
    color: string;
    quantity: number;
    product: Pick<DbProduct, "id" | "name" | "image_urls">;
  }>;
};

type SupabaseFunctionInvokeError = Error & {
  context?: Response;
};

type DcmFunctionErrorBody = DcmPaymentResult & {
  details?: string;
};

async function extractDcmPaymentErrorResponse(error: SupabaseFunctionInvokeError) {
  let message = error.message || "Payment request failed";
  let paymentResult: DcmPaymentResult | null = null;
  const response = error.context;

  if (!response) {
    return { message, paymentResult };
  }

  try {
    const body = (await response.clone().json()) as DcmFunctionErrorBody;
    paymentResult = body && typeof body === "object" ? body : null;
    message = body?.message || body?.error || body?.details || message;
    return { message, paymentResult };
  } catch {
    try {
      const text = await response.clone().text();
      if (text) {
        message = text;
        paymentResult = { message: text };
      }
    } catch {
      // keep fallback message
    }
  }

  return { message, paymentResult };
}

const CART_ID_KEY = "tees_cart_id";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

const mapDbProduct = (row: DbProduct): Product => ({
  id: row.id,
  name: row.name,
  price: row.price,
  category: row.category,
  featuredImage: row.featured_image_url || row.image_urls?.[0] || "",
  images: row.image_urls || [],
  useDesignSelection: row.use_design_selection ?? false,
  colors: row.colors,
  sizes: row.sizes,
  description: row.description,
  specs: row.specs,
  isNew: row.is_new ?? false,
  isFeatured: row.is_featured ?? false,
});

const mapProductToDb = (product: Product): DbProduct => ({
  id: product.id,
  name: product.name,
  price: product.price,
  category: product.category,
  featured_image_url: product.featuredImage || product.images?.[0] || null,
  image_urls: product.images,
  use_design_selection: product.useDesignSelection,
  colors: product.colors,
  sizes: product.sizes,
  description: product.description,
  specs: product.specs,
  is_new: product.isNew ?? false,
  is_featured: product.isFeatured ?? false,
});

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: true });
  if (error || !data) {
    return [];
  }
  return data.map((row) => mapDbProduct(row as DbProduct));
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapDbProduct(data as DbProduct);
}

export async function seedProducts(products: Product[]): Promise<void> {
  if (products.length === 0) return;
  const payload = products.map(mapProductToDb);
  await supabase.from("products").upsert(payload, { onConflict: "id" });
}

export async function listProductsAdmin(): Promise<Product[]> {
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map((row) => mapDbProduct(row as DbProduct));
}

export async function createProduct(product: Product): Promise<void> {
  const { error } = await supabase.from("products").insert(mapProductToDb(product));
  if (error) throw error;
}

export async function updateProduct(product: Product): Promise<void> {
  const { error } = await supabase.from("products").update(mapProductToDb(product)).eq("id", product.id);
  if (error) throw error;
}

export async function deleteProduct(productId: string): Promise<void> {
  await supabase.from("products").delete().eq("id", productId);
}

export async function listCategories(): Promise<DbCategory[]> {
  const orderedQuery = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (!orderedQuery.error && orderedQuery.data) {
    return (orderedQuery.data as DbCategory[]).map((item, index) => ({
      ...item,
      sort_order: item.sort_order ?? index,
    }));
  }

  // Backward compatibility for databases where sort_order is not yet present.
  const fallbackQuery = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (fallbackQuery.error || !fallbackQuery.data) return [];
  return (fallbackQuery.data as DbCategory[]).map((item, index) => ({
    ...item,
    sort_order: index,
  }));
}

export async function createCategory(category: { id: string; name: string; description?: string; image_url?: string; sort_order?: number }): Promise<void> {
  const { sort_order, ...basePayload } = category;
  const payload = typeof sort_order === "number" ? category : basePayload;

  const firstAttempt = await supabase.from("categories").insert(payload);
  if (!firstAttempt.error) return;

  // If sort_order column is missing, retry without it.
  if (typeof sort_order === "number") {
    const retry = await supabase.from("categories").insert(basePayload);
    if (!retry.error) return;
    throw retry.error;
  }

  throw firstAttempt.error;
}

export async function updateCategory(category: { id: string; name: string; description?: string; image_url?: string; sort_order?: number }): Promise<void> {
  const payload = {
    name: category.name,
    description: category.description,
    image_url: category.image_url ?? null,
    ...(typeof category.sort_order === "number" ? { sort_order: category.sort_order } : {}),
  };

  const firstAttempt = await supabase
    .from("categories")
    .update(payload)
    .eq("id", category.id);
  if (!firstAttempt.error) return;

  // If sort_order column is missing, retry without it.
  if (typeof category.sort_order === "number") {
    const retry = await supabase
      .from("categories")
      .update({
        name: category.name,
        description: category.description,
        image_url: category.image_url ?? null,
      })
      .eq("id", category.id);
    if (!retry.error) return;
    throw retry.error;
  }

  throw firstAttempt.error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

export async function updateCategoryOrder(id: string, sortOrder: number): Promise<void> {
  const { error } = await supabase
    .from("categories")
    .update({ sort_order: sortOrder })
    .eq("id", id);

  // If sort_order column does not exist yet, skip hard failure so categories remain usable.
  if (error && typeof error.message === "string" && error.message.toLowerCase().includes("sort_order")) {
    return;
  }
  if (error) throw error;
}

export async function listHeroImages(): Promise<DbHeroImage[]> {
  const { data, error } = await supabase
    .from("hero_images")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as DbHeroImage[];
}

export async function createHeroImage(imageUrl: string, sortOrder: number): Promise<void> {
  const { error } = await supabase
    .from("hero_images")
    .insert({ image_url: imageUrl, sort_order: sortOrder });
  if (error) throw error;
}

export async function updateHeroImageOrder(id: string, sortOrder: number): Promise<void> {
  const { error } = await supabase
    .from("hero_images")
    .update({ sort_order: sortOrder })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteHeroImage(id: string): Promise<void> {
  const { error } = await supabase.from("hero_images").delete().eq("id", id);
  if (error) throw error;
}

export async function getOrCreateCartId(): Promise<string> {
  const existing = localStorage.getItem(CART_ID_KEY);
  if (existing) return existing;

  const { data, error } = await supabase.from("carts").insert({ status: "open" }).select("id").single();
  if (error || !data?.id) {
    throw new Error("Failed to create cart");
  }
  localStorage.setItem(CART_ID_KEY, data.id);
  return data.id;
}

export async function fetchCartItems(cartId: string): Promise<DbCartItem[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select("quantity,size,color,product:products(*)")
    .eq("cart_id", cartId);

  if (error || !data) return [];
  // Ensure we extract the first item if product is returned as an array
  return data.map(item => ({
    ...item,
    product: Array.isArray(item.product) ? item.product[0] : item.product
  })) as unknown as DbCartItem[];
}

export async function setCartItemQuantity(
  cartId: string,
  productId: string,
  size: string,
  color: string,
  quantity: number
): Promise<void> {
  if (quantity <= 0) {
    await supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", cartId)
      .eq("product_id", productId)
      .eq("size", size)
      .eq("color", color);
    return;
  }

  await supabase
    .from("cart_items")
    .upsert(
      { cart_id: cartId, product_id: productId, size, color, quantity },
      { onConflict: "cart_id,product_id,size,color" }
    );
}

export async function clearCartRemote(cartId: string): Promise<void> {
  await supabase.from("cart_items").delete().eq("cart_id", cartId);
}

export async function createOrder(
  cartId: string | null,
  items: Array<{ product: Product; size: string; color: string; quantity: number }>,
  total: number,
  shippingDetails: {
    customer_name: string;
    phone_number: string;
    email: string;
    shipping_address: string;
    shipping_city: string;
    payment_method: string;
    payment_network?: string;
  }
): Promise<string | null> {
  const orderPayload = {
    total,
    status: "pending",
    ...shippingDetails,
    payment_status: "pending",
    ...(isUuid(cartId) ? { cart_id: cartId } : {}),
  };

  const { data, error } = await supabase
    .from("orders")
    .insert(orderPayload)
    .select("id")
    .single();

  if (error || !data?.id) {
    console.error("Error creating order:", error);
    return null;
  }

  const orderItems = items.map((item) => ({
    order_id: data.id,
    product_id: item.product.id,
    size: item.size,
    color: item.color,
    quantity: item.quantity,
    unit_price: item.product.price,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
  if (itemsError) {
    console.error("Error creating order items:", itemsError);
    return null;
  }

  return data.id as string;
}

export async function initiateDcmPayment(
  accountNumber: string,
  amount: number,
  network: string,
  orderId: string,
  narration?: string
): Promise<DcmPaymentResult> {
  const { data, error } = await supabase.functions.invoke("pay-dcm", {
    body: {
      accountNumber,
      amount,
      network,
      orderId,
      narration: narration || `Order ${orderId.slice(0, 8).toUpperCase()}`,
    }
  });

  if (error) {
    const invokeError = error as SupabaseFunctionInvokeError;
    const { message, paymentResult } = await extractDcmPaymentErrorResponse(invokeError);

    if (paymentResult && getDcmPaymentOutcome(paymentResult).accepted) {
      return paymentResult;
    }

    throw new Error(message);
  }
  return data as DcmPaymentResult;
}

export async function updateOrderPaymentState(
  orderId: string,
  paymentResult: DcmPaymentResult
): Promise<void> {
  const outcome = getDcmPaymentOutcome(paymentResult);
  await setOrderPaymentSnapshot(orderId, outcome.status, outcome.reference);
}

export async function setOrderPaymentSnapshot(
  orderId: string,
  paymentStatus: string,
  paymentReference?: string | null
): Promise<void> {
  const payload = {
    payment_status: paymentStatus,
    ...(paymentReference ? { payment_reference: paymentReference } : {}),
  };

  const { error } = await supabase
    .from("orders")
    .update(payload)
    .eq("id", orderId);

  if (error) {
    throw error;
  }
}

export async function getOrderPaymentSnapshot(
  orderId: string
): Promise<OrderPaymentSnapshot | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("payment_status,payment_reference")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as OrderPaymentSnapshot | null;
}

export async function listOrders(): Promise<DbOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("id,total,status,created_at,customer_name,phone_number,email,shipping_address,shipping_city,payment_method,payment_network,payment_status,order_items(size,color,quantity,unit_price,product:products(id,name,image_urls))")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(order => ({
    ...order,
    order_items: order.order_items.map(item => ({
      ...item,
      product: Array.isArray(item.product) ? item.product[0] : item.product
    }))
  })) as unknown as DbOrder[];
}

export type OrderStatusUpdateResult = {
  emailSent: boolean;
  emailSkippedReason?: string;
};

async function sendOrderStatusEmail(params: {
  orderType: "store" | "custom";
  orderId: string;
  status: string;
  previousStatus?: string;
  customerName?: string | null;
  customerEmail?: string | null;
}): Promise<OrderStatusUpdateResult> {
  if (!params.customerEmail) {
    return { emailSent: false, emailSkippedReason: "Missing customer email." };
  }

  const { error } = await supabase.functions.invoke("notify-order-status", {
    body: {
      orderType: params.orderType,
      orderId: params.orderId,
      status: params.status,
      previousStatus: params.previousStatus,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
    },
  });

  if (error) {
    throw new Error(error.message || "Failed to send status email");
  }

  return { emailSent: true };
}

export async function updateOrderStatus(id: string, status: string): Promise<OrderStatusUpdateResult> {
  const { data: currentOrder, error: lookupError } = await supabase
    .from("orders")
    .select("id,status,email,customer_name")
    .eq("id", id)
    .maybeSingle();
  if (lookupError) throw lookupError;

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);
  if (error) throw error;

  return sendOrderStatusEmail({
    orderType: "store",
    orderId: id,
    status,
    previousStatus: currentOrder?.status,
    customerName: currentOrder?.customer_name,
    customerEmail: currentOrder?.email,
  });
}

export async function listCarts(): Promise<DbCart[]> {
  const { data, error } = await supabase
    .from("carts")
    .select("id,status,created_at,updated_at,cart_items(size,color,quantity,product:products(id,name,image_urls))")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(cart => ({
    ...cart,
    cart_items: cart.cart_items.map(item => ({
      ...item,
      product: Array.isArray(item.product) ? item.product[0] : item.product
    }))
  })) as unknown as DbCart[];
}

export type DbCustomOrder = {
  id: string;
  customer_name: string;
  phone_number: string;
  email: string;
  delivery_location: string;
  product_type: string;
  product_color: string;
  sizes: string[];
  quantity: number;
  print_placement: string;
  custom_text: string | null;
  design_file_url: string | null;
  order_notes: string | null;
  status: string;
  created_at: string;
};

export async function listCustomOrders(): Promise<DbCustomOrder[]> {
  const { data, error } = await supabase
    .from("custom_orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as DbCustomOrder[];
}

export async function updateCustomOrderStatus(id: string, status: string): Promise<OrderStatusUpdateResult> {
  const { data: currentOrder, error: lookupError } = await supabase
    .from("custom_orders")
    .select("id,status,email,customer_name")
    .eq("id", id)
    .maybeSingle();
  if (lookupError) throw lookupError;

  const { error } = await supabase
    .from("custom_orders")
    .update({ status })
    .eq("id", id);
  if (error) throw error;

  return sendOrderStatusEmail({
    orderType: "custom",
    orderId: id,
    status,
    previousStatus: currentOrder?.status,
    customerName: currentOrder?.customer_name,
    customerEmail: currentOrder?.email,
  });
}

export async function uploadProductImage(file: File): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("product_images")
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from("product_images")
    .getPublicUrl(filePath);

  return data.publicUrl;
}
