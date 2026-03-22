import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { listCategories } from "@/lib/supabaseApi";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/hooks/use-products";

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
};

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "all";
  const { data: products = [] } = useProducts();
  const { data: dbCategories = [] } = useQuery({
    queryKey: ["admin-collections"],
    queryFn: listCategories,
  });

  const filtered = activeCategory === "all"
    ? products
    : products.filter((p) => p.category === activeCategory);

  return (
    <main className="pt-28 pb-16">
      <div className="container">
        <motion.div {...fadeInUp} className="text-center mb-14">
          <p className="technical-label mb-3">Browse</p>
          <h1 className="font-serif text-3xl md:text-5xl font-medium italic">Our Collection</h1>
        </motion.div>

        {/* Category Filter */}
        <motion.div {...fadeInUp} className="flex justify-center gap-6 mb-14 flex-wrap">
          <button
            onClick={() => setSearchParams({})}
            className={`text-[11px] uppercase tracking-[0.2em] pb-1 transition-colors ${
              activeCategory === "all"
                ? "text-foreground border-b border-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {dbCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSearchParams({ category: cat.id })}
              className={`text-[11px] uppercase tracking-[0.2em] pb-1 transition-colors ${
                activeCategory === cat.id
                  ? "text-foreground border-b border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </motion.div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="py-20 text-center text-muted-foreground italic text-sm">
            No products found in this collection.
          </div>
        )}
      </div>
    </main>
  );
}
