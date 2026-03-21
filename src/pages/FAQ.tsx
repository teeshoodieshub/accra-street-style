import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
};

const faqs = [
  {
    question: "How do I track my order?",
    answer:
      "You will receive a shipping confirmation email with tracking details once your order ships. If you do not receive it within 3 business days, email hello@teesandhoodies.com.",
  },
  {
    question: "Do you offer exchanges?",
    answer:
      "Yes. Exchanges are available within 14 days of delivery for unworn items with tags attached. Contact us to start an exchange.",
  },
  {
    question: "What sizes do you carry?",
    answer:
      "We offer sizes XS to XXL for most items. Each product page includes fit notes and measurements when available.",
  },
  {
    question: "How should I wash my pieces?",
    answer:
      "Turn garments inside out, wash cold with like colors, and hang dry or tumble dry low to preserve the print.",
  },
  {
    question: "Can I change or cancel my order?",
    answer:
      "If your order has not been processed, we can help. Email us as soon as possible with your order number.",
  },
];

export default function FAQPage() {
  return (
    <main className="pt-28 pb-16">
      <div className="container max-w-3xl">
        <motion.div {...fadeInUp} className="text-center">
          <p className="technical-label mb-3">Support</p>
          <h1 className="font-serif text-3xl md:text-4xl font-medium italic">Frequently Asked Questions</h1>
        </motion.div>

        <motion.div {...fadeInUp} className="mt-12 space-y-4">
          {faqs.map((item) => (
            <div key={item.question} className="border border-border p-6">
              <h2 className="font-serif text-lg text-foreground mb-2">{item.question}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}
