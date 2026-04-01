import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
};

export default function ReturnPolicyPage() {
  return (
    <main className="pt-28 pb-16">
      <SEOHead
        title="Return Policy"
        description="Tees & Hoodies Hub return and exchange policy. 14-day returns on unworn items with tags attached. Easy process for refunds and exchanges."
        canonical="/returns"
      />
      <div className="container max-w-3xl">
        <motion.div {...fadeInUp} className="text-center">
          <p className="technical-label mb-3">Support</p>
          <h1 className="font-serif text-3xl md:text-4xl font-medium italic">Return Policy</h1>
          <p className="text-sm text-muted-foreground mt-3">Last updated: March 17, 2026</p>
        </motion.div>

        <motion.div {...fadeInUp} className="mt-12 space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">Overview</h2>
            <p>
              We want you to love your pieces. If something is not right, you can request a return or exchange
              within 14 days of delivery. Items must be unworn, unwashed, and in their original packaging.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">Eligibility</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Return window: 14 days from delivery.</li>
              <li>Items must be unused, with tags attached.</li>
              <li>Final sale items are not eligible for return.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">How to start a return</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Email hello@teesandhoodies.com with your order number.</li>
              <li>Tell us whether you want a refund or exchange.</li>
              <li>We will reply with return instructions within 2 business days.</li>
            </ol>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">Refunds and exchanges</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Refunds are issued to the original payment method after inspection.</li>
              <li>Exchanges ship once the return is received and approved.</li>
              <li>Original shipping fees are non-refundable.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">Damaged or incorrect items</h2>
            <p>
              If your order arrives damaged or incorrect, contact us within 7 days of delivery. Include a photo of the
              item and packaging so we can make it right quickly.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">Return shipping</h2>
            <p>
              Customers are responsible for return shipping unless the item is defective or incorrect. We recommend a
              trackable service for all returns.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">Need help?</h2>
            <p>Reach us at hello@teesandhoodies.com and we will respond within 2 business days.</p>
          </section>
        </motion.div>
      </div>
    </main>
  );
}
