import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Upload,
  Clock,
  Package,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
};

const PRODUCTS = ["T-Shirts", "Hoodies", "Sleeveless T-Shirts", "Polo Shirts"];

const COLORS = [
  { name: "Black", hex: "#1a1a1a" },
  { name: "White", hex: "#ffffff" },
  { name: "Ash", hex: "#b2beb5" },
  { name: "Deep Ash", hex: "#6e6e6e" },
  { name: "Wine", hex: "#722f37" },
  { name: "Army Green", hex: "#4b5320" },
  { name: "Cream", hex: "#fffdd0" },
  { name: "Purple", hex: "#6a0dad" },
];

const SIZES = ["S", "M", "L", "XL", "XXL"];

const PLACEMENTS = ["Front Print", "Back Print", "Front & Back", "Sleeve Print"];

const inputClass =
  "w-full h-12 px-4 border border-border bg-transparent text-sm focus:outline-none focus:border-foreground transition-colors";
const labelClass =
  "text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2 block";

export default function CustomPrints() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    product: "",
    quantity: "",
    color: "",
    sizes: [] as string[],
    placement: "",
    customText: "",
    orderNotes: "",
    name: "",
    phone: "",
    email: "",
    deliveryLocation: "",
  });

  const [fileName, setFileName] = useState("");

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleSize = (size: string) =>
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  const clearFile = () => {
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.product ||
      !form.quantity ||
      !form.color ||
      form.sizes.length === 0 ||
      !form.placement ||
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.email.trim() ||
      !form.deliveryLocation.trim()
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const qty = parseInt(form.quantity, 10);
    if (isNaN(qty) || qty < 10) {
      toast.error("Minimum order quantity is 10.");
      return;
    }

    setIsSubmitting(true);

    try {
      let designFileUrl = null;

      // 1. Upload file if exists
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('design_uploads')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error("Failed to upload design file: " + uploadError.message);
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('design_uploads')
          .getPublicUrl(filePath);
          
        designFileUrl = publicUrl;
      }

      // 2. Save order to database
      const orderPayload = {
        customer_name: form.name,
        phone_number: form.phone,
        email: form.email,
        delivery_location: form.deliveryLocation,
        product_type: form.product,
        product_color: form.color,
        sizes: form.sizes,
        quantity: qty,
        print_placement: form.placement,
        custom_text: form.customText,
        order_notes: form.orderNotes,
        design_file_url: designFileUrl,
        status: 'Pending'
      };

      const { error: dbError } = await supabase
        .from('custom_orders')
        .insert([orderPayload]);

      if (dbError) {
        throw new Error("Failed to save order: " + dbError.message);
      }

      setSubmitted(true);
      toast.success("Order submitted successfully!");
    } catch (error: any) {
      console.error("Order submission error:", error);
      toast.error(error.message || "An error occurred while submitting your order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="pt-28 pb-16">
        <div className="container max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-accent" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-medium italic mb-4">
              Order Submitted!
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed mb-8">
              Thank you for your custom print order. Your order details have been
              received. Our team will review your request and get back to you
              within 24 hours with a quote and production timeline.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setForm({
                  product: "",
                  quantity: "",
                  color: "",
                  sizes: [],
                  placement: "",
                  customText: "",
                  orderNotes: "",
                  name: "",
                  phone: "",
                  email: "",
                  deliveryLocation: "",
                });
                clearFile();
              }}
              className="h-12 px-8 bg-foreground text-primary-foreground text-sm uppercase tracking-[0.1em] font-medium inline-flex items-center gap-2 transition-opacity hover:opacity-90"
            >
              Place Another Order
            </button>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-28 pb-16">
      <div className="container max-w-3xl">
        {/* Header */}
        <motion.div {...fadeInUp} className="text-center">
          <p className="technical-label mb-3">Custom Printing Service</p>
          <h1 className="font-serif text-3xl md:text-4xl font-medium italic">
            Order Custom Prints
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto mt-4 leading-relaxed">
            Create your own custom printed apparel for your brand, event, team,
            or business. Upload your design and place your order easily.
          </p>
        </motion.div>

        {/* Info cards */}
        <motion.div
          {...fadeInUp}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12"
        >
          <div className="flex items-center gap-3 p-5 border border-border">
            <div className="w-10 h-10 rounded-full bg-foreground text-primary-foreground flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Min. 10 Pieces</p>
              <p className="text-[11px] text-muted-foreground">
                Minimum order quantity
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-5 border border-border">
            <div className="w-10 h-10 rounded-full bg-foreground text-primary-foreground flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">5 – 7 Business Days</p>
              <p className="text-[11px] text-muted-foreground">
                Estimated production time
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-5 border border-border">
            <div className="w-10 h-10 rounded-full bg-foreground text-primary-foreground flex items-center justify-center shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Order Confirmation</p>
              <p className="text-[11px] text-muted-foreground">
                We confirm by email after submission
              </p>
            </div>
          </div>
        </motion.div>

        {/* Order Form */}
        <motion.form
          {...fadeInUp}
          onSubmit={handleSubmit}
          className="mt-14 space-y-10"
        >
          {/* 1. Product Selection */}
          <fieldset>
            <legend className={labelClass}>1. Product Type</legend>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-1">
              {PRODUCTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set("product", p)}
                  className={`h-12 border text-sm transition-colors ${
                    form.product === p
                      ? "border-foreground bg-foreground text-primary-foreground"
                      : "border-border hover:border-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </fieldset>

          {/* 2. Quantity */}
          <div>
            <label htmlFor="quantity" className={labelClass}>
              2. Quantity (min. 10 pieces)
            </label>
            <input
              id="quantity"
              type="number"
              min={10}
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
              className={inputClass}
              placeholder="e.g. 50"
              required
            />
          </div>

          {/* 3. Apparel Color */}
          <fieldset>
            <legend className={labelClass}>3. Apparel Color</legend>
            <div className="flex flex-wrap gap-3 mt-1">
              {COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => set("color", c.name)}
                  className={`flex items-center gap-2.5 h-10 px-4 border text-sm transition-colors ${
                    form.color === c.name
                      ? "border-foreground bg-foreground/5"
                      : "border-border hover:border-foreground"
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full border border-border shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  {c.name}
                </button>
              ))}
            </div>
          </fieldset>

          {/* 4. Sizes */}
          <fieldset>
            <legend className={labelClass}>4. Sizes (select all that apply)</legend>
            <div className="flex flex-wrap gap-3 mt-1">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSize(s)}
                  className={`w-14 h-12 border text-sm font-medium transition-colors ${
                    form.sizes.includes(s)
                      ? "border-foreground bg-foreground text-primary-foreground"
                      : "border-border hover:border-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>

          {/* 5. Print Placement */}
          <fieldset>
            <legend className={labelClass}>5. Print Placement</legend>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-1">
              {PLACEMENTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set("placement", p)}
                  className={`h-12 border text-sm transition-colors ${
                    form.placement === p
                      ? "border-foreground bg-foreground text-primary-foreground"
                      : "border-border hover:border-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </fieldset>

          {/* 6. Design Upload */}
          <div>
            <label className={labelClass}>6. Upload Your Design</label>
            <p className="text-[11px] text-muted-foreground mb-3">
              Accepted formats: PNG, JPG, PDF, AI
            </p>
            {fileName ? (
              <div className="flex items-center gap-3 p-4 border border-border">
                <Upload className="w-4 h-4 text-accent shrink-0" />
                <span className="text-sm truncate flex-1">{fileName}</span>
                <button
                  type="button"
                  onClick={clearFile}
                  className="p-1 hover:opacity-70 transition-opacity"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-28 border-2 border-dashed border-border hover:border-foreground transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Upload className="w-5 h-5" />
                <span className="text-sm">Click to upload your design</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.pdf,.ai"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* 7. Custom Text */}
          <div>
            <label htmlFor="customText" className={labelClass}>
              7. Custom Text{" "}
              <span className="normal-case tracking-normal text-muted-foreground/60">
                (optional)
              </span>
            </label>
            <input
              id="customText"
              type="text"
              value={form.customText}
              onChange={(e) => set("customText", e.target.value)}
              className={inputClass}
              placeholder="Text you want printed on the apparel"
              maxLength={200}
            />
          </div>

          {/* 8. Order Notes */}
          <div>
            <label htmlFor="orderNotes" className={labelClass}>
              8. Order Notes
            </label>
            <textarea
              id="orderNotes"
              value={form.orderNotes}
              onChange={(e) => set("orderNotes", e.target.value)}
              className="w-full h-32 px-4 py-3 border border-border bg-transparent text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
              placeholder='e.g. "Church anniversary shirt with logo on front and theme text at the back."'
              maxLength={1000}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* 9. Contact Details */}
          <fieldset className="space-y-5">
            <legend className={labelClass}>9. Contact Details</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="name" className={labelClass}>
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={inputClass}
                  placeholder="Your full name"
                  required
                  maxLength={100}
                />
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 0241234567"
                  required
                  maxLength={20}
                />
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={inputClass}
                  placeholder="your@email.com"
                  required
                  maxLength={255}
                />
              </div>
              <div>
                <label htmlFor="deliveryLocation" className={labelClass}>
                  Delivery Location
                </label>
                <input
                  id="deliveryLocation"
                  type="text"
                  value={form.deliveryLocation}
                  onChange={(e) => set("deliveryLocation", e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Accra, East Legon"
                  required
                  maxLength={200}
                />
              </div>
            </div>
          </fieldset>

          {/* 10. Submit */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 px-8 bg-foreground text-primary-foreground text-sm uppercase tracking-[0.1em] font-medium inline-flex items-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>Processing... <Loader2 className="w-4 h-4 animate-spin" /></>
              ) : (
                <>Submit Custom Order <Send className="w-4 h-4" /></>
              )}
            </button>
            <p className="text-[11px] text-muted-foreground">
              We will confirm receipt and follow up by email.
            </p>
          </div>
        </motion.form>
      </div>
    </main>
  );
}
