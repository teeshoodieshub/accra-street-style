import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
};

export default function SizeGuidePage() {
  return (
    <main className="pt-28 pb-16">
      <div className="container max-w-3xl">
        <motion.div {...fadeInUp} className="text-center">
          <p className="technical-label mb-3">Support</p>
          <h1 className="font-serif text-3xl md:text-4xl font-medium italic">Size Guide</h1>
        </motion.div>

        <motion.div {...fadeInUp} className="mt-12 space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">Fit notes</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Most tees and hoodies have an oversized fit with a relaxed shoulder.</li>
              <li>If you prefer a closer fit, consider sizing down.</li>
              <li>If you are between sizes, size up for a roomier drape.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">How to measure</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Chest: measure around the fullest part of your chest.</li>
              <li>Length: measure from the highest shoulder point to the hem.</li>
              <li>Sleeve: measure from shoulder seam to cuff.</li>
            </ol>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">Need sizing help?</h2>
            <p>Email hello@teesandhoodies.com with your height, weight, and preferred fit, and we will recommend a size.</p>
          </section>
        </motion.div>
      </div>
    </main>
  );
}
