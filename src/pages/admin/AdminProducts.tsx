import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProduct, deleteProduct, listProductsAdmin, updateProduct, listCategories, uploadProductImage } from "@/lib/supabaseApi";
import type { Product } from "@/data/products";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload, X } from "lucide-react";

const emptyForm: Product = {
  id: "",
  name: "",
  price: 0,
  category: "",
  featuredImage: "",
  images: [],
  colors: [],
  sizes: [],
  description: "",
  specs: "",
  isNew: false,
};

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const AVAILABLE_COLORS = [
  "Black", "White", "Navy Blue", "Royal Blue", "Red", "Maroon", "Forest Green", "Charcoal", "Heather Gray", "Gold"
];

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: listProductsAdmin,
  });

  const { data: dbCategories = [] } = useQuery({
    queryKey: ["admin-collections"],
    queryFn: listCategories,
  });

  const [form, setForm] = useState<Product>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingFeatured, setIsUploadingFeatured] = useState(false);
  const [customColorInput, setCustomColorInput] = useState("");
  const [showCustomColor, setShowCustomColor] = useState(false);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [showCustomSize, setShowCustomSize] = useState(false);

  // Local state for "global" custom suggestions
  const [extraColors, setExtraColors] = useState<string[]>(() => {
    const saved = localStorage.getItem("tees_extra_colors");
    return saved ? JSON.parse(saved) : [];
  });
  const [extraSizes, setExtraSizes] = useState<string[]>(() => {
    const saved = localStorage.getItem("tees_extra_sizes");
    return saved ? JSON.parse(saved) : [];
  });

  const addExtraColor = (val: string) => {
    if (!AVAILABLE_COLORS.includes(val) && !extraColors.includes(val)) {
      const updated = [...extraColors, val];
      setExtraColors(updated);
      localStorage.setItem("tees_extra_colors", JSON.stringify(updated));
    }
  };

  const addExtraSize = (val: string) => {
    const upVal = val.toUpperCase();
    if (!AVAILABLE_SIZES.includes(upVal) && !extraSizes.includes(upVal)) {
      const updated = [...extraSizes, upVal];
      setExtraSizes(updated);
      localStorage.setItem("tees_extra_sizes", JSON.stringify(updated));
    }
  };

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setForm(emptyForm);
      toast({ title: "Product created" });
    },
    onError: () => toast({ title: "Create failed", description: "Could not create product." }),
  });

  const updateMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setForm(emptyForm);
      setEditingId(null);
      toast({ title: "Product updated" });
    },
    onError: () => toast({ title: "Update failed", description: "Could not update product." }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Product deleted" });
    },
    onError: () => toast({ title: "Delete failed", description: "Could not delete product." }),
  });

  const handleEdit = (product: Product) => {
    setForm(product);
    setEditingId(product.id);
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id || !form.name) {
      toast({ title: "Missing fields", description: "Product id and name are required." });
      return;
    }
    if (isEditing) {
      updateMutation.mutate(form);
      return;
    }
    createMutation.mutate(form);
  };

  const handleChange = (key: keyof Product, value: string | number | boolean | string[]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const uploadPromises = Array.from(files).map(file => uploadProductImage(file));
      const urls = await Promise.all(uploadPromises);
      
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...urls]
      }));
      
      toast({ title: `${urls.length} images uploaded successfully` });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading one or more images.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingFeatured(true);
      const url = await uploadProductImage(file);
      setForm((prev) => ({ ...prev, featuredImage: url }));
      toast({ title: "Featured image uploaded successfully" });
    } catch (error) {
      console.error("Featured image upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading the featured image.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingFeatured(false);
    }
  };

  const removeImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleNameChange = (name: string) => {
    handleChange("name", name);
    if (!isEditing) {
      const generatedId = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      handleChange("id", generatedId);
    }
  };

  const toggleSelection = (key: "sizes" | "colors", value: string) => {
    setForm(prev => {
      const current = prev[key] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-10">
      <section className="border border-border p-6">
        <h2 className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
          {isEditing ? "Edit Product" : "New Product"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">ID</span>
            <input
              type="text"
              value={form.id}
              onChange={(e) => handleChange("id", e.target.value)}
              className="mt-2 w-full h-10 px-3 border border-border bg-transparent text-sm focus:outline-none focus:border-foreground"
              disabled={isEditing}
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="mt-2 w-full h-10 px-3 border border-border bg-transparent text-sm focus:outline-none focus:border-foreground"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">ID (Auto-generated)</span>
            <input
              type="text"
              value={form.id}
              onChange={(e) => handleChange("id", e.target.value)}
              className="mt-2 w-full h-10 px-3 border border-border bg-transparent text-sm focus:outline-none focus:border-foreground"
              disabled={isEditing}
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Price</span>
            <input
              type="number"
              value={form.price}
              onChange={(e) => handleChange("price", Number(e.target.value))}
              className="mt-2 w-full h-10 px-3 border border-border bg-transparent text-sm focus:outline-none focus:border-foreground"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Category</span>
            <select
              value={form.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className="mt-2 w-full h-10 px-3 border border-border bg-transparent text-sm focus:outline-none focus:border-foreground"
            >
              <option value="" disabled>Select a collection</option>
              {dbCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground block">Featured Image</span>
            {form.featuredImage ? (
              <div className="relative aspect-[4/3] border border-border overflow-hidden bg-secondary group">
                <img src={form.featuredImage} alt="Featured preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleChange("featuredImage", "")}
                  className="absolute top-2 right-2 p-1 bg-background/80 hover:bg-background text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFeaturedImageUpload}
                  className="hidden"
                  id="featured-image-upload"
                  disabled={isUploadingFeatured}
                />
                <label
                  htmlFor="featured-image-upload"
                  className={`flex flex-col items-center justify-center gap-2 w-full py-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-foreground transition-colors ${
                    isUploadingFeatured ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isUploadingFeatured ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Upload Featured Image
                      </span>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground block">Product Images</span>
            
            <div className="grid grid-cols-3 gap-2">
              {form.images.map((img, idx) => (
                <div key={idx} className="relative aspect-square border border-border overflow-hidden bg-secondary group">
                  <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-background/80 hover:bg-background text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="relative">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="image-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="image-upload"
                className={`flex flex-col items-center justify-center gap-2 w-full py-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-foreground transition-colors ${
                  isUploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Upload More Images
                    </span>
                  </>
                )}
              </label>
            </div>
          </div>
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Colors</span>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => toggleSelection("colors", color)}
                  className={`px-3 py-1.5 border text-[10px] uppercase tracking-wider transition-colors ${
                    form.colors.includes(color)
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:border-foreground"
                  }`}
                >
                  {color}
                </button>
              ))}
              {/* Global custom colors */}
              {extraColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => toggleSelection("colors", color)}
                  className={`px-3 py-1.5 border text-[10px] uppercase tracking-wider transition-colors ${
                    form.colors.includes(color)
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:border-foreground"
                  }`}
                >
                  {color}
                </button>
              ))}
              {/* Fallback for colors in this product but not in either list */}
              {form.colors.filter(c => !AVAILABLE_COLORS.includes(c) && !extraColors.includes(c)).map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => toggleSelection("colors", color)}
                  className="px-3 py-1.5 border text-[10px] uppercase tracking-wider bg-foreground text-background border-foreground transition-colors"
                >
                  {color}
                </button>
              ))}
              {showCustomColor ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    autoFocus
                    value={customColorInput}
                    onChange={(e) => setCustomColorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = customColorInput.trim();
                        if (val) {
                          if (!form.colors.includes(val)) toggleSelection("colors", val);
                          addExtraColor(val);
                        }
                        setCustomColorInput("");
                        setShowCustomColor(false);
                      }
                      if (e.key === "Escape") { setShowCustomColor(false); setCustomColorInput(""); }
                    }}
                    placeholder="e.g. Teal"
                    className="w-24 h-8 px-2 border border-border bg-transparent text-[10px] focus:outline-none focus:border-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = customColorInput.trim();
                      if (val) {
                        if (!form.colors.includes(val)) toggleSelection("colors", val);
                        addExtraColor(val);
                      }
                      setCustomColorInput("");
                      setShowCustomColor(false);
                    }}
                    className="h-8 px-2 border border-foreground bg-foreground text-background text-[10px]"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCustomColor(true)}
                  className="w-8 h-8 flex items-center justify-center border border-dashed border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                  title="Add custom color"
                >
                  <X className="w-3 h-3 rotate-45" />
                </button>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sizes</span>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SIZES.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSelection("sizes", size)}
                  className={`w-10 h-10 flex items-center justify-center border text-[10px] uppercase tracking-wider transition-colors ${
                    form.sizes.includes(size)
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:border-foreground"
                  }`}
                >
                  {size}
                </button>
              ))}
              {/* Global custom sizes */}
              {extraSizes.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSelection("sizes", size)}
                  className={`w-10 h-10 flex items-center justify-center border text-[10px] uppercase tracking-wider transition-colors ${
                    form.sizes.includes(size)
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:border-foreground"
                  }`}
                >
                  {size}
                </button>
              ))}
              {/* Fallback for sizes in this product but not in either list */}
              {form.sizes.filter(s => !AVAILABLE_SIZES.includes(s) && !extraSizes.includes(s)).map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSelection("sizes", size)}
                  className="w-10 h-10 flex items-center justify-center border text-[10px] uppercase tracking-wider bg-foreground text-background border-foreground transition-colors"
                >
                  {size}
                </button>
              ))}
              {showCustomSize ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    autoFocus
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = customSizeInput.trim().toUpperCase();
                        if (val) {
                          if (!form.sizes.includes(val)) toggleSelection("sizes", val);
                          addExtraSize(val);
                        }
                        setCustomSizeInput("");
                        setShowCustomSize(false);
                      }
                      if (e.key === "Escape") { setShowCustomSize(false); setCustomSizeInput(""); }
                    }}
                    placeholder="e.g. 4XL"
                    className="w-20 h-10 px-2 border border-border bg-transparent text-[10px] focus:outline-none focus:border-foreground uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = customSizeInput.trim().toUpperCase();
                      if (val) {
                        if (!form.sizes.includes(val)) toggleSelection("sizes", val);
                        addExtraSize(val);
                      }
                      setCustomSizeInput("");
                      setShowCustomSize(false);
                    }}
                    className="h-10 px-2 border border-foreground bg-foreground text-background text-[10px]"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCustomSize(true)}
                  className="w-10 h-10 flex items-center justify-center border border-dashed border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                  title="Add custom size"
                >
                  <X className="w-3 h-3 rotate-45" />
                </button>
              )}
            </div>
          </div>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Specs</span>
            <input
              type="text"
              value={form.specs}
              onChange={(e) => handleChange("specs", e.target.value)}
              className="mt-2 w-full h-10 px-3 border border-border bg-transparent text-sm focus:outline-none focus:border-foreground"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="mt-2 w-full min-h-[120px] px-3 py-2 border border-border bg-transparent text-sm focus:outline-none focus:border-foreground"
            />
          </label>
          <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <input
              type="checkbox"
              checked={form.isNew ?? false}
              onChange={(e) => handleChange("isNew", e.target.checked)}
            />
            New arrival
          </label>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="h-11 px-5 bg-foreground text-primary-foreground text-xs uppercase tracking-[0.15em] font-medium transition-opacity hover:opacity-90"
            >
              {isEditing ? "Update" : "Create"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={handleCancel}
                className="h-11 px-5 border border-border text-xs uppercase tracking-[0.15em] hover:border-foreground transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Products</h2>
          <span className="text-xs text-muted-foreground">{products.length} total</span>
        </div>
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="border border-border p-4 flex items-center gap-4">
              <div className="w-16 h-16 bg-secondary overflow-hidden">
                {(product.featuredImage || (product.images && product.images.length > 0)) && (
                  <img src={product.featuredImage || product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{product.id}</p>
                <p className="text-xs text-muted-foreground mt-1">GHâ‚µ{product.price}</p>
              </div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em]">
                <button
                  onClick={() => handleEdit(product)}
                  className="px-3 py-2 border border-border hover:border-foreground transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteMutation.mutate(product.id)}
                  className="px-3 py-2 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No products yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
