import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
};

export default function AboutPage() {
  return (
    <main className="pt-28 pb-16">
      <SEOHead
        title="About Us"
        description="Tees & Hoodies Hub was born in the creative heart of Accra — Osu. We craft 450-500 GSM heavyweight streetwear inspired by West African culture. Founded in 2023, designed in Accra for the world."
        canonical="/about"
      />
      <div className="container max-w-3xl">
        <motion.div {...fadeInUp} className="text-center">
          <p className="technical-label mb-3">Our Story</p>
          <h1 className="font-serif text-3xl md:text-5xl font-medium italic leading-tight">
            Where Modern Elegance<br />Meets Heritage Craft.
          </h1>
        </motion.div>

        <motion.div {...fadeInUp} className="mt-14 space-y-6 text-muted-foreground leading-relaxed">
          <p>
            Tees & Hoodies was born in the creative heart of Accra — Osu. What started as a passion project between friends who couldn't find heavyweight streetwear that matched their style has grown into a movement.
          </p>
          <p>
            Every piece is designed in Accra, for Accra. We source 450–500GSM heavyweight cotton because we believe streetwear should feel as good as it looks. Our oversized silhouettes are engineered for the tropical heat without compromising on the drop-shoulder, relaxed fits that define modern street fashion.
          </p>
          <p>
            We don't chase trends. We study the textures of our city — the concrete walls of Jamestown, the red earth of Madina, the high-sun shadows of Oxford Street — and translate them into garments that tell our story.
          </p>
        </motion.div>

        <motion.div {...fadeInUp} className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Founded", value: "2023" },
            { label: "Based in", value: "Accra, Ghana" },
            { label: "Fabric Weight", value: "450–500GSM" },
          ].map((stat) => (
            <div key={stat.label} className="p-6 border border-border text-center">
              <p className="technical-label mb-2">{stat.label}</p>
              <p className="font-serif text-xl font-medium italic">{stat.value}</p>
            </div>
          ))}
        </motion.div>

        <motion.div {...fadeInUp} className="mt-16 p-8 bg-foreground text-primary-foreground text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary-foreground/40 mb-4">Our Mission</p>
          <p className="font-serif text-lg md:text-2xl font-medium italic leading-relaxed">
            "To prove that world-class streetwear can be born anywhere — starting with Accra."
          </p>
        </motion.div>
      </div>
    </main>
  );
}
