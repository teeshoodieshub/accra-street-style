import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";

const categoryLabels: Record<string, string> = {
  "graphic-tees": "Graphic Tees",
  hoodies: "Hoodies",
  "sleeveless-hoodies": "Sleeveless",
};

const formatCategory = (slug: string) => {
  if (categoryLabels[slug]) return categoryLabels[slug];
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
};

export default function ProductCard({
  product,
  showAddToCart = false,
}: {
  product: Product;
  showAddToCart?: boolean;
}) {
  const { addItem } = useCart();

  const handleQuickAdd = () => {
    const size = product.sizes[0];
    const color = product.colors[0];
    if (!size || !color) return;
    addItem(product, size, color);
  };

  return (
    <motion.div {...fadeInUp} className="group">
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
          <img
            src={product.featuredImage || product.images?.[0] || ""}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="pt-5 pb-2">
          <p className="technical-label mb-2">{formatCategory(product.category)}</p>
          <h3 className="font-serif text-lg md:text-xl font-medium italic">{product.name}</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">{product.description}</p>
          <div className="flex items-center justify-between mt-4">
            <span className="price-display text-sm font-semibold">GHC {product.price.toLocaleString()}.00</span>
            <span className="text-accent text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
              View Details <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </Link>
      {showAddToCart && (
        <button
          onClick={handleQuickAdd}
          className="w-full h-11 mt-2 bg-foreground text-primary-foreground text-xs uppercase tracking-[0.15em] font-medium transition-opacity hover:opacity-90"
        >
          Add to Cart
        </button>
      )}
    </motion.div>
  );
}
