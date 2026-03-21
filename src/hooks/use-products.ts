import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/supabaseApi";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000,
  });
}
