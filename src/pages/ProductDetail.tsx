import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Minus, Plus, Check, ShieldCheck, Truck, RefreshCw, ZoomIn, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/hooks/use-products";
import SEOHead from "@/components/SEOHead";

const colorNames: Record<string, string> = {
  "#111": "Black",
  "#fff": "White",
  "#8B8B8B": "Ash",
  "#722F37": "Wine",
  "#4B5320": "Army Green",
  "#F5F5DC": "Cream",
};

function AccordionItem({ title, content }: { title: string; content: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center group"
      >
        <span className="text-[11px] uppercase tracking-[0.2em] font-bold group-hover:text-muted-foreground transition-colors">{title}</span>
        {isOpen ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        <p className="pt-4 text-xs leading-relaxed text-muted-foreground max-w-sm">
          {content}
        </p>
      </motion.div>
    </div>
  );
}

function ZoomModal({
  images,
  activeIndex,
  onClose,
  onPrev,
  onNext,
}: {
  images: string[];
  activeIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posRef = useRef({ x: 0, y: 0 });

  useEffect(() => { setScale(1); setPos({ x: 0, y: 0 }); }, [activeIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onPrev, onNext]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale(prev => Math.min(4, Math.max(1, prev - e.deltaY * 0.002)));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX - posRef.current.x, y: e.clientY - posRef.current.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const newPos = { x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y };
    posRef.current = newPos;
    setPos(newPos);
  };

  const handleMouseUp = () => setDragging(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute top-4 right-4 flex gap-3 z-10">
        <button onClick={() => setScale(s => Math.min(4, s + 0.5))} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-colors">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={() => { setScale(1); setPos({ x: 0, y: 0 }); }} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-colors text-xs font-bold">
          1:1
        </button>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {scale === 1 && (
        <p className="absolute bottom-4 left-0 right-0 text-center text-white/40 text-[10px] uppercase tracking-widest pointer-events-none">
          Scroll to zoom Â· Drag to pan Â· arrows to navigate
        </p>
      )}

      {images.length > 1 && (
        <>
          <button onClick={onPrev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={onNext} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      <div
        className="w-full h-full flex items-center justify-center overflow-hidden"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in' }}
      >
        <motion.img
          key={activeIndex}
          src={images[activeIndex]}
          alt={`Product zoom ${activeIndex + 1}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            transform: `scale(${scale}) translate(${pos.x / scale}px, ${pos.y / scale}px)`,
            maxHeight: '90vh',
            maxWidth: '90vw',
            objectFit: 'contain',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
          {images.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeIndex ? 'bg-white scale-125' : 'bg-white/30'}`} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { data: products = [] } = useProducts();
  const product = products.find((p) => p.id === id);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [variantSelections, setVariantSelections] = useState<Record<string, Record<string, number>>>({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const handlePrev = useCallback(() =>
    setActiveImageIndex(i => (i - 1 + (product?.images?.length ?? 1)) % (product?.images?.length ?? 1)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [product?.images?.length]
  );
  const handleNext = useCallback(() =>
    setActiveImageIndex(i => (i + 1) % (product?.images?.length ?? 1)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [product?.images?.length]
  );

  if (!product) {
    return (
      <div className="pt-28 pb-16 container text-center">
        <p className="font-serif text-xl italic">Product not found</p>
        <Link to="/shop" className="technical-label mt-4 inline-block hover:text-foreground">â† Back to collection</Link>
      </div>
    );
  }

  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 2);
  const usesImageDesignSelection = product.useDesignSelection;
  const currentImageVariant = usesImageDesignSelection
    ? `Design ${activeImageIndex + 1}`
    : product.colors[activeImageIndex];
  const isCurrentImageVariantSelected = Boolean(
    currentImageVariant && selectedVariants.includes(currentImageVariant)
  );
  const selectedCount = selectedVariants.length;
  const selectionCount = selectedVariants.reduce(
    (total, variant) => total + Object.keys(variantSelections[variant] || {}).length,
    0
  );
  const totalPieces = selectedVariants.reduce(
    (total, variant) =>
      total +
      Object.values(variantSelections[variant] || {}).reduce((sum, qty) => sum + qty, 0),
    0
  );

  const toggleVariant = (variant: string, imageIdx?: number) => {
    setSelectedVariants((prev) => {
      if (prev.includes(variant)) {
        setVariantSelections((selections) => {
          const next = { ...selections };
          delete next[variant];
          return next;
        });
        return prev.filter((v) => v !== variant);
      }

      setVariantSelections((selections) => ({
        ...selections,
        [variant]: selections[variant] || {},
      }));
      return [...prev, variant];
    });
    if (typeof imageIdx === "number" && product.images[imageIdx]) {
      setActiveImageIndex(imageIdx);
    }
  };

  const toggleVariantSize = (variant: string, size: string) => {
    setVariantSelections((prev) => {
      const currentVariantSelections = prev[variant] || {};
      const nextVariantSelections = { ...currentVariantSelections };

      if (nextVariantSelections[size]) {
        delete nextVariantSelections[size];
      } else {
        nextVariantSelections[size] = 1;
      }

      return {
        ...prev,
        [variant]: nextVariantSelections,
      };
    });
  };

  const updateVariantSizeQuantity = (variant: string, size: string, nextQty: number) => {
    setVariantSelections((prev) => {
      const currentVariantSelections = prev[variant] || {};
      const nextVariantSelections = { ...currentVariantSelections };

      if (nextQty <= 0) {
        delete nextVariantSelections[size];
      } else {
        nextVariantSelections[size] = nextQty;
      }

      return {
        ...prev,
        [variant]: nextVariantSelections,
      };
    });
  };

  const handleAddToCart = () => {
    if (totalPieces === 0) return;
    for (const variant of selectedVariants) {
      const selections = variantSelections[variant] || {};
      for (const [size, qty] of Object.entries(selections)) {
        for (let i = 0; i < qty; i++) {
          addItem(product, size, variant);
        }
      }
    }
  };

  return (
    <>
      <main className="pt-24 pb-16">
      <SEOHead
        title={product.name}
        description={product.description || `Shop ${product.name} from Tees & Hoodies Hub. Premium heavyweight streetwear crafted in Accra, Ghana. ${product.specs || ""}`}
        canonical={`/product/${product.id}`}
        ogImage={product.images?.[0]}
        ogType="product"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.name,
          "image": product.images || [],
          "description": product.description || "",
          "brand": { "@type": "Brand", "name": "Tees & Hoodies Hub" },
          "offers": {
            "@type": "Offer",
            "price": product.price,
            "priceCurrency": "GHS",
            "availability": "https://schema.org/InStock",
            "url": `https://teesandhoodies.com/product/${product.id}`
          }
        }}
      />
      <div className="container">
        <Link to="/shop" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors mb-10">
          <ArrowLeft className="w-3 h-3" /> Back to Collection
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Image Gallery */}
          <div className="lg:col-span-7 flex flex-col-reverse lg:flex-row gap-4">
            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-flow-col auto-cols-max grid-rows-7 gap-3 overflow-x-auto overflow-y-hidden no-scrollbar scroll-smooth py-1 lg:max-w-[180px]">
                {product.images.map((img, idx) => {
                  const linkedVariant = usesImageDesignSelection ? `Design ${idx + 1}` : product.colors[idx];
                  const isVariantSelected = Boolean(linkedVariant && selectedVariants.includes(linkedVariant));
                  const isActive = activeImageIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (linkedVariant) {
                          toggleVariant(linkedVariant, idx);
                          return;
                        }
                        setActiveImageIndex(idx);
                      }}
                      title={linkedVariant || `View ${idx + 1}`}
                      className={`relative flex-shrink-0 w-16 h-20 bg-secondary overflow-hidden transition-all duration-300 rounded-sm ${
                        isActive
                          ? "ring-2 ring-foreground opacity-100 scale-105"
                          : "opacity-50 hover:opacity-90"
                      }`}
                    >
                      <img src={img} alt={`${product.name} â€” ${linkedVariant || `view ${idx + 1}`}`} className="w-full h-full object-cover" />

                      {/* Color dot indicator - now more integrated into the corner */}
                      {!usesImageDesignSelection && linkedVariant && (
                        <div
                          className={`absolute bottom-1.5 right-1.5 w-2.5 h-2.5 rounded-full border border-white/50 shadow-sm transition-transform duration-300 ${isActive ? "scale-110" : "scale-100"}`}
                          style={{ backgroundColor: linkedVariant }}
                        />
                      )}

                      {/* Selected-color checkmark (Tick) - positioned in the top-right */}
                      <AnimatePresence>
                        {isVariantSelected && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute top-2 right-2 z-10"
                          >
                            <div className="bg-foreground text-background rounded-full p-1 shadow-md">
                              <Check className="w-3.5 h-3.5" strokeWidth={3} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Active hint (not necessarily selected color yet) */}
                      {!isVariantSelected && isActive && (
                        <div className="absolute top-2 right-2 z-10">
                          <div className="bg-black/20 backdrop-blur-sm text-white/70 rounded-full p-1 border border-white/20">
                            <Check className="w-3.5 h-3.5 opacity-50" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            
            {/* Main Image */}
            <div
              className="flex-1 relative group bg-secondary overflow-hidden h-[420px] md:h-[560px] lg:h-[680px] cursor-zoom-in"
              onClick={() => setIsZoomed(true)}
            >
              <motion.div
                key={activeImageIndex}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full"
              >
                <img 
                  src={product.images?.[activeImageIndex] || ""} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
              </motion.div>
              
              {/* Badge */}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="bg-white/80 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black rounded-full">New Arrival</span>
              </div>

              {/* Zoom hint overlay */}
              {/* Selected variant overlay on main image */}
              <AnimatePresence>
                {isCurrentImageVariantSelected && (
                  <motion.div
                    key={`main-tick-${currentImageVariant}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-6 right-6 z-10 flex flex-col items-center gap-2"
                  >
                    <div className="flex items-center gap-2 bg-foreground/90 backdrop-blur-md text-background px-3 py-1.5 rounded-full shadow-xl border border-white/10">
                      <Check className="w-4 h-4" strokeWidth={3} />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Selected</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-black/50 backdrop-blur-md text-white rounded-full px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                  <ZoomIn className="w-3 h-3" /> Zoom
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start space-y-8"
          >
            <div className="space-y-2">
              <p className="technical-label text-muted-foreground">{product.specs}</p>
              <h1 className="font-serif text-3xl md:text-5xl font-medium italic leading-tight">{product.name}</h1>
              <p className="text-2xl font-light tracking-tight mt-2">GHC {product.price.toLocaleString()}.00</p>
            </div>

            <p className="text-[15px] text-muted-foreground leading-relaxed max-w-md">
              {product.description}
            </p>

            {/* Variant selector (Design or Color) */}
            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-end">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
                  {usesImageDesignSelection ? "Design" : "Color"}
                </p>
                <p className="text-[11px] font-medium italic">
                  {usesImageDesignSelection
                    ? selectedVariants.length > 0 ? `${selectedVariants.length} selected` : "Select design(s)"
                    : selectedVariants.length > 0
                      ? `${selectedVariants.length} selected`
                      : "Select color(s)"}
                </p>
              </div>
              {usesImageDesignSelection ? (
                <div className="flex flex-wrap gap-2">
                  {product.images.map((_, designIdx) => {
                    const design = `Design ${designIdx + 1}`;
                    return (
                    <button
                      key={design}
                      onClick={() => toggleVariant(design, designIdx)}
                      className={`h-10 px-4 border text-[10px] uppercase tracking-wider transition-colors ${
                        selectedVariants.includes(design)
                          ? "bg-foreground text-background border-foreground"
                          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                      }`}
                    >
                      {design}
                    </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex gap-3">
                  {product.colors.map((color, colorIdx) => (
                    <button
                      key={color}
                      onClick={() => toggleVariant(color, colorIdx)}
                      className={`group relative w-10 h-10 rounded-full transition-all duration-300 ${
                        selectedVariants.includes(color)
                          ? "ring-2 ring-foreground ring-offset-4 ring-offset-background scale-110"
                          : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: color, border: "1px solid rgba(0,0,0,0.1)" }}
                      aria-label={colorNames[color] || color}
                    >
                      {selectedVariants.includes(color) && (
                        <motion.div className="absolute inset-0 flex items-center justify-center">
                          <Check className={`w-4 h-4 ${color === "#fff" || color === "#F5F5DC" ? "text-black" : "text-white"}`} />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Size selector */}
            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-end">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Size</p>
                <button className="text-[10px] uppercase tracking-wider font-bold underline underline-offset-4 hover:text-muted-foreground transition-colors">Size Guide</button>
              </div>
              {selectedVariants.length === 0 ? (
                <p className="text-xs text-muted-foreground">Select at least one {usesImageDesignSelection ? "design" : "color"} first.</p>
              ) : (
                <div className="space-y-3">
                  {selectedVariants.map((variant) => (
                    <div key={variant} className="border border-border p-3 space-y-2">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                        {usesImageDesignSelection ? variant : `${colorNames[variant] || variant}`}
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {product.sizes.map((size) => (
                          <button
                            key={`${variant}-${size}`}
                            onClick={() => toggleVariantSize(variant, size)}
                            className={`h-10 text-[11px] uppercase font-bold tracking-widest transition-all duration-300 border rounded-sm ${
                              variantSelections[variant]?.[size]
                                ? "bg-foreground text-primary-foreground border-foreground shadow-lg"
                                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                      {Object.keys(variantSelections[variant] || {}).length > 0 && (
                        <div className="space-y-2 pt-1">
                          {Object.entries(variantSelections[variant] || {}).map(([size, qty]) => (
                            <div key={`${variant}-${size}-qty`} className="flex items-center justify-between border border-border/60 px-3 py-2">
                              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                                {size}
                              </p>
                              <div className="flex items-center border border-border rounded-sm overflow-hidden bg-secondary/30">
                                <button
                                  onClick={() => updateVariantSizeQuantity(variant, size, qty - 1)}
                                  className="w-9 h-9 flex items-center justify-center hover:bg-secondary transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-sm tabular-nums w-10 text-center font-medium">{qty}</span>
                                <button
                                  onClick={() => updateVariantSizeQuantity(variant, size, qty + 1)}
                                  className="w-9 h-9 flex items-center justify-center hover:bg-secondary transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity & Add to cart */}
            <div className="flex gap-4 pt-6">
              <button
                onClick={handleAddToCart}
                disabled={selectedCount === 0 || totalPieces === 0}
                className="w-full h-14 bg-foreground text-primary-foreground text-[11px] uppercase tracking-[0.2em] font-bold transition-all hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed group relative overflow-hidden flex items-center justify-center gap-2 rounded-sm"
              >
                {selectedCount === 0
                  ? `Select ${usesImageDesignSelection ? "design(s)" : "color(s)"}`
                  : totalPieces === 0
                  ? `Select size(s) (${selectionCount})`
                  : (
                  <>
                    Add to Bag
                    <motion.span 
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="inline-block"
                    >
                      ({totalPieces} pieces / {selectionCount} selections) - GHC {(product.price * totalPieces).toLocaleString()}
                    </motion.span>
                  </>
                )}
              </button>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-3 gap-4 py-8 border-y border-border/50">
              <div className="flex flex-col items-center text-center gap-2">
                <Truck className="w-5 h-5 text-muted-foreground" />
                <span className="text-[9px] uppercase tracking-tighter font-bold">Fast Shipping</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <RefreshCw className="w-5 h-5 text-muted-foreground" />
                <span className="text-[9px] uppercase tracking-tighter font-bold">Easy Returns</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                <span className="text-[9px] uppercase tracking-tighter font-bold">Secure Payment</span>
              </div>
            </div>

            {/* Accordions */}
            <div className="divide-y divide-border/50">
              <AccordionItem 
                title="Details & Composition" 
                content="Our premium heavy weight garments are crafted from 100% thick cotton, ensuring durability and a luxury feel. Designed for an oversized, boxy fit characteristic of modern Accra street culture."
              />
              <AccordionItem 
                title="Size & Fit" 
                content="Model is 6'1 wearing size Large. True to size for an oversized fit. We recommend sizing down if you prefer a more tailored look."
              />
              <AccordionItem 
                title="Shipping & Returns" 
                content="Complimentary delivery within Accra on orders above GHC 1000. For international shipping, rates are calculated at checkout. Returns accepted within 7 days of delivery."
              />
            </div>
          </motion.div>
        </div>


        {/* Related */}
        {related.length > 0 && (
          <section className="mt-24">
            <div className="text-center mb-12">
              <p className="technical-label mb-2">You may also like</p>
              <h2 className="font-serif text-2xl font-medium italic">Related Pieces</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>

    <AnimatePresence>
      {isZoomed && product.images && (
        <ZoomModal
          images={product.images}
          activeIndex={activeImageIndex}
          onClose={() => setIsZoomed(false)}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}
    </AnimatePresence>
    </>
  );
}

