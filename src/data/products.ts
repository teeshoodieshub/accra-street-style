export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  featuredImage: string;
  images: string[];
  colors: string[];
  sizes: string[];
  description: string;
  specs: string;
  isNew?: boolean;
};

// Products are now managed via Supabase database
export const products: Product[] = [];

export const categories = [
  { id: "graphic-tees", name: "Graphic Tees" },
  { id: "hoodies", name: "Hoodies" },
  { id: "sleeveless-hoodies", name: "Sleeveless Hoodies" },
];
