import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listHeroImages,
  createHeroImage,
  updateHeroImageOrder,
  deleteHeroImage,
  uploadProductImage,
  DbCategory,
  DbHeroImage,
} from "@/lib/supabaseApi";
import { defaultHeroImageUrls } from "@/lib/heroDefaults";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, X, Check, ChevronLeft, ChevronRight } from "lucide-react";

type CategoryForm = {
  id: string;
  name: string;
  description: string;
  image_url: string;
};

const emptyForm: CategoryForm = {
  id: "",
  name: "",
  description: "",
  image_url: "",
};

export default function AdminCollections() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [isUploadingHero, setIsUploadingHero] = useState(false);

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ["admin-collections"],
    queryFn: listCategories,
  });
  const { data: heroImages = [], isLoading: isLoadingHeroImages } = useQuery({
    queryKey: ["admin-hero-images"],
    queryFn: listHeroImages,
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
      setForm(emptyForm);
      setIsAdding(false);
      toast.success("Collection created successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to create collection: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
      setEditingId(null);
      setForm(emptyForm);
      toast.success("Collection updated successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to update collection: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
      toast.success("Collection deleted successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete collection: ${error.message}`);
    },
  });

  const deleteHeroMutation = useMutation({
    mutationFn: deleteHeroImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hero-images"] });
      queryClient.invalidateQueries({ queryKey: ["hero-images"] });
      toast.success("Header image removed");
    },
    onError: (error: any) => {
      toast.error(`Failed to remove header image: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id || !form.name) {
      toast.error("ID and Name are required");
      return;
    }

    if (editingId) {
      updateMutation.mutate(form);
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (category: DbCategory) => {
    setEditingId(category.id);
    setForm({
      id: category.id,
      name: category.name,
      description: category.description || "",
      image_url: category.image_url || "",
    });
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const uploadHeroImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingHero(true);
    try {
      const imageUrls = await Promise.all(Array.from(files).map((file) => uploadProductImage(file)));
      const startSortOrder = heroImages.length > 0
        ? Math.max(...heroImages.map((image) => image.sort_order)) + 1
        : 0;
      await Promise.all(
        imageUrls.map((imageUrl, index) => createHeroImage(imageUrl, startSortOrder + index))
      );

      queryClient.invalidateQueries({ queryKey: ["admin-hero-images"] });
      queryClient.invalidateQueries({ queryKey: ["hero-images"] });
      toast.success(`${imageUrls.length} header image(s) uploaded`);
    } catch (error: any) {
      toast.error(`Failed to upload header image(s): ${error.message}`);
    } finally {
      setIsUploadingHero(false);
      e.target.value = "";
    }
  };

  const moveHeroImage = async (image: DbHeroImage, direction: "left" | "right") => {
    const currentIndex = heroImages.findIndex((item) => item.id === image.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= heroImages.length) return;

    const reordered = [...heroImages];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    try {
      await Promise.all(
        reordered.map((item, index) => updateHeroImageOrder(item.id, index))
      );
      queryClient.invalidateQueries({ queryKey: ["admin-hero-images"] });
      queryClient.invalidateQueries({ queryKey: ["hero-images"] });
    } catch (error: any) {
      toast.error(`Failed to re-order header images: ${error.message}`);
    }
  };

  const uploadCategoryImage = async (file: File) => {
    try {
      const imageUrl = await uploadProductImage(file);
      setForm((prev) => ({ ...prev, image_url: imageUrl }));
      toast.success("Category image uploaded");
    } catch (error: any) {
      toast.error(`Failed to upload category image: ${error.message}`);
    }
  };

  const importDefaultHeroImages = async () => {
    if (heroImages.length > 0) {
      return;
    }

    setIsUploadingHero(true);
    try {
      await Promise.all(
        defaultHeroImageUrls.map((imageUrl, index) => createHeroImage(imageUrl, index))
      );
      queryClient.invalidateQueries({ queryKey: ["admin-hero-images"] });
      queryClient.invalidateQueries({ queryKey: ["hero-images"] });
      toast.success("Current hero images added to dashboard");
    } catch (error: any) {
      toast.error(`Failed to add current hero images: ${error.message}`);
    } finally {
      setIsUploadingHero(false);
    }
  };

  return (
    <section className="space-y-8">
      <div className="border border-border p-6 bg-background/50">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Header Images</h3>
            <p className="text-xs text-muted-foreground mt-1">These images power the homepage hero carousel.</p>
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background text-xs uppercase tracking-[0.1em] hover:opacity-90 transition-opacity cursor-pointer">
            {isUploadingHero ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Upload Images
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={uploadHeroImages}
              className="hidden"
              disabled={isUploadingHero}
            />
          </label>
        </div>

        {isLoadingHeroImages ? (
          <div className="py-10 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : heroImages.length === 0 ? (
          <div className="border border-dashed border-border py-10 text-center text-sm text-muted-foreground italic">
            <p>No header images yet. Upload new ones or add the current homepage hero images.</p>
            <button
              type="button"
              onClick={importDefaultHeroImages}
              disabled={isUploadingHero}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 border border-border text-[10px] uppercase tracking-[0.15em] text-foreground hover:bg-secondary disabled:opacity-50"
            >
              {isUploadingHero ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add Current Hero Images
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {heroImages.map((image, index) => (
              <div key={image.id} className="border border-border bg-background overflow-hidden">
                <div className="aspect-[4/5] bg-secondary">
                  <img src={image.image_url} alt={`Hero slide ${index + 1}`} className="w-full h-full object-cover" />
                </div>
                <div className="p-3 flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Slide {index + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveHeroImage(image, "left")}
                      disabled={index === 0}
                      className="h-7 w-7 border border-border inline-flex items-center justify-center disabled:opacity-40"
                      title="Move left"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveHeroImage(image, "right")}
                      disabled={index === heroImages.length - 1}
                      className="h-7 w-7 border border-border inline-flex items-center justify-center disabled:opacity-40"
                      title="Move right"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Delete this header image?")) {
                          deleteHeroMutation.mutate(image.id);
                        }
                      }}
                      className="h-7 w-7 border border-border inline-flex items-center justify-center text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
        <div>
          <h2 className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Collections Management</h2>
          <p className="text-xs text-muted-foreground mt-1">Manage product categories and collections</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-xs uppercase tracking-[0.1em] hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Collection
          </button>
        )}
      </div>

      {isAdding && (
        <div className="border border-border p-6 bg-background/50 animate-in fade-in slide-in-from-top-2">
          <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">
            {editingId ? "Edit Collection" : "New Collection"}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 ring-offset-background">
            <div className="space-y-4">
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Slug (ID)</span>
                <input
                  type="text"
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  disabled={!!editingId}
                  placeholder="e.g. limited-edition"
                  className="mt-2 w-full h-10 px-3 border border-border bg-transparent text-sm focus:outline-none focus:border-foreground disabled:opacity-50"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Display Name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Limited Edition"
                  className="mt-2 w-full h-10 px-3 border border-border bg-transparent text-sm focus:outline-none focus:border-foreground"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Category Image</span>
                <div className="mt-2 border border-border p-3 bg-background/40">
                  {form.image_url ? (
                    <div className="relative aspect-[4/3] mb-3">
                      <img src={form.image_url} alt="Category preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-24 mb-3 border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                      No image selected
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 px-3 py-2 border border-border text-[10px] uppercase tracking-[0.12em] cursor-pointer hover:bg-secondary transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            void uploadCategoryImage(file);
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {form.image_url && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, image_url: "" }))}
                        className="inline-flex items-center gap-2 px-3 py-2 border border-border text-[10px] uppercase tracking-[0.12em] hover:bg-secondary transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </label>
            </div>
            <div className="space-y-4">
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Tell about this collection..."
                  className="mt-2 w-full h-[106px] px-3 py-2 border border-border bg-transparent text-sm focus:outline-none focus:border-foreground resize-none"
                />
              </label>
            </div>
            <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-border text-[10px] uppercase tracking-widest hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex items-center gap-2 px-6 py-2 bg-foreground text-background text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                {editingId ? "Update Collection" : "Save Collection"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : collections.length === 0 ? (
          <div className="col-span-full border border-dashed border-border py-12 text-center text-sm text-muted-foreground italic">
            No collections found. Create your first one above.
          </div>
        ) : (
          collections.map((category) => (
            <div key={category.id} className="border border-border p-6 bg-background group hover:border-foreground transition-colors relative">
              {category.image_url && (
                <div className="aspect-[4/3] mb-4 overflow-hidden bg-secondary">
                  <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-start justify-between mb-4">
                <span className="text-[10px] px-2 py-0.5 bg-secondary text-muted-foreground rounded-full font-mono uppercase">
                  {category.id}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-1.5 hover:bg-secondary rounded-sm transition-colors text-muted-foreground hover:text-foreground"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete "${category.name}"? This will not delete products in this collection.`)) {
                        deleteMutation.mutate(category.id);
                      }
                    }}
                    className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-sm transition-colors text-muted-foreground"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h4 className="font-serif italic text-lg mb-2">{category.name}</h4>
              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                {category.description || "No description provided."}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
