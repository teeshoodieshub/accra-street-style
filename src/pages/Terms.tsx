import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
};

export default function TermsPage() {
  return (
    <main className="pt-28 pb-16">
      <div className="container max-w-3xl">
        <motion.div {...fadeInUp} className="text-center">
          <p className="technical-label mb-3">Legal</p>
          <h1 className="font-serif text-3xl md:text-4xl font-medium italic">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mt-3">Last updated: March 17, 2026</p>
        </motion.div>

        <motion.div {...fadeInUp} className="mt-12 space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">Overview</h2>
            <p>
              By using this website, you agree to these terms. If you do not agree, please do not use the site or place
              an order.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">Orders and payment</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>All orders are subject to availability and confirmation.</li>
              <li>Prices and product details may change without notice.</li>
              <li>Payment is processed securely by third-party payment providers.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">Intellectual property</h2>
            <p>
              All content on this site, including images and design elements, is the property of Tees &amp; Hoodies and
              may not be used without permission.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, Tees &amp; Hoodies is not liable for indirect or consequential
              damages arising from your use of the site or products.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">Changes</h2>
            <p>
              We may update these terms from time to time. Continued use of the site indicates acceptance of the
              updated terms.
            </p>
          </section>
        </motion.div>
      </div>
    </main>
  );
}
