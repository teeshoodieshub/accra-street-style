import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
};

export default function PrivacyPage() {
  return (
    <main className="pt-28 pb-16">
      <SEOHead
        title="Privacy Policy"
        description="Read the Tees & Hoodies Hub privacy policy. Learn how we collect, use, and protect your personal information when you shop with us."
        canonical="/privacy"
      />
      <div className="container max-w-3xl">
        <motion.div {...fadeInUp} className="text-center">
          <p className="technical-label mb-3">Legal</p>
          <h1 className="font-serif text-3xl md:text-4xl font-medium italic">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-3">Last updated: March 17, 2026</p>
        </motion.div>

        <motion.div {...fadeInUp} className="mt-12 space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">Information we collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Contact details such as name, email, phone, and shipping address.</li>
              <li>Order information and payment confirmation from our payment processors.</li>
              <li>Basic usage data such as pages viewed and device information.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">How we use your information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To process orders, deliver products, and provide support.</li>
              <li>To communicate order updates and respond to requests.</li>
              <li>To improve our website, products, and customer experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">Sharing and disclosure</h2>
            <p>
              We share information only with service providers who help us operate the store, process payments, or
              deliver orders. We do not sell your personal information.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">Cookies</h2>
            <p>
              We use cookies and similar technologies to keep the site functional and measure performance. You can
              control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">Data security</h2>
            <p>
              We take reasonable measures to protect your information. However, no system can be guaranteed 100%
              secure.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">Your choices</h2>
            <p>
              You may request access, correction, or deletion of your personal information by contacting us at
              hello@teesandhoodies.com.
            </p>
          </section>
        </motion.div>
      </div>
    </main>
  );
}
