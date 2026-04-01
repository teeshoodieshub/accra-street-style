import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Instagram, Mail, Send } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
};

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, message } = formData;
    if (!name.trim() || !email.trim() || !message.trim()) return;
    window.location.href = `mailto:hello@teesandhoodies.com?subject=Message from ${encodeURIComponent(name)}&body=${encodeURIComponent(message)}%0A%0AFrom: ${encodeURIComponent(email)}`;
  };

  return (
    <main className="pt-28 pb-16">
      <SEOHead
        title="Contact Us"
        description="Get in touch with Tees & Hoodies Hub. Reach us via WhatsApp, Instagram, or email at hello@teesandhoodies.com. Based in Accra, Ghana."
        canonical="/contact"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "Tees & Hoodies Hub",
          "email": "hello@teesandhoodies.com",
          "url": "https://teesandhoodies.com/contact",
          "address": { "@type": "PostalAddress", "addressLocality": "Accra", "addressRegion": "Greater Accra", "addressCountry": "GH" },
          "sameAs": ["https://instagram.com/teesandhoodies"]
        }}
      />
      <div className="container max-w-3xl">
        <motion.div {...fadeInUp} className="text-center">
          <p className="technical-label mb-3">Get in Touch</p>
          <h1 className="font-serif text-3xl md:text-4xl font-medium italic">Contact Us</h1>
        </motion.div>

        {/* Quick links */}
        <motion.div {...fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          <a
            href="https://wa.me/233000000000"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 p-5 border border-border transition-colors hover:border-foreground group"
          >
            <div className="w-10 h-10 rounded-full bg-foreground text-primary-foreground flex items-center justify-center group-hover:bg-accent transition-colors">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">WhatsApp</p>
              <p className="text-[11px] text-muted-foreground">Message us directly</p>
            </div>
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 p-5 border border-border transition-colors hover:border-foreground group"
          >
            <div className="w-10 h-10 rounded-full bg-foreground text-primary-foreground flex items-center justify-center group-hover:bg-accent transition-colors">
              <Instagram className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Instagram</p>
              <p className="text-[11px] text-muted-foreground">@teesandhoodies</p>
            </div>
          </a>
          <a
            href="mailto:hello@teesandhoodies.com"
            className="flex items-center gap-3 p-5 border border-border transition-colors hover:border-foreground group"
          >
            <div className="w-10 h-10 rounded-full bg-foreground text-primary-foreground flex items-center justify-center group-hover:bg-accent transition-colors">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-[11px] text-muted-foreground">hello@teesandhoodies.com</p>
            </div>
          </a>
        </motion.div>

        {/* Contact form */}
        <motion.form {...fadeInUp} onSubmit={handleSubmit} className="mt-14 space-y-6">
          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2 block">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-12 px-4 border border-border bg-transparent text-sm focus:outline-none focus:border-foreground transition-colors"
              placeholder="Your name"
              required
              maxLength={100}
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2 block">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full h-12 px-4 border border-border bg-transparent text-sm focus:outline-none focus:border-foreground transition-colors"
              placeholder="your@email.com"
              required
              maxLength={255}
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2 block">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full h-32 px-4 py-3 border border-border bg-transparent text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
              placeholder="What's on your mind?"
              required
              maxLength={1000}
            />
          </div>
          <button
            type="submit"
            className="h-12 px-8 bg-foreground text-primary-foreground text-sm uppercase tracking-[0.1em] font-medium inline-flex items-center gap-2 transition-opacity hover:opacity-90"
          >
            Send Message <Send className="w-4 h-4" />
          </button>
        </motion.form>
      </div>
    </main>
  );
}
