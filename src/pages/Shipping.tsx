import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
};

export default function ShippingPage() {
  return (
    <main className="pt-28 pb-16">
      <SEOHead
        title="Shipping & Delivery"
        description="Shipping and delivery information for Tees & Hoodies Hub. 1-3 day delivery in Accra, nationwide and international shipping available. Order tracking included."
        canonical="/shipping"
      />
      <div className="container max-w-3xl">
        <motion.div {...fadeInUp} className="text-center">
          <p className="technical-label mb-3">Support</p>
          <h1 className="font-serif text-3xl md:text-4xl font-medium italic">Shipping and Delivery</h1>
          <p className="text-sm text-muted-foreground mt-3">Last updated: March 17, 2026</p>
        </motion.div>

        <motion.div {...fadeInUp} className="mt-12 space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">Processing time</h2>
            <p>Orders are processed within 1-3 business days, Monday through Friday, excluding holidays.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">Estimated delivery windows</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Accra: 1-3 business days after dispatch.</li>
              <li>Ghana (outside Accra): 2-5 business days after dispatch.</li>
              <li>West Africa: 5-10 business days after dispatch.</li>
              <li>International: 7-21 business days after dispatch.</li>
            </ul>
            <p className="mt-3">
              Delivery times are estimates and may vary due to customs, weather, or carrier delays.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">Shipping costs</h2>
            <p>Shipping rates are calculated at checkout based on destination and package weight.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">Order tracking</h2>
            <p>
              When your order ships, you will receive a confirmation email with tracking details. If you do not receive
              a tracking email within 3 business days, contact us at hello@teesandhoodies.com.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">Customs and duties</h2>
            <p>
              International orders may be subject to customs fees, duties, or taxes. These fees are the responsibility
              of the recipient.
            </p>
          </section>
        </motion.div>
      </div>
    </main>
  );
}
