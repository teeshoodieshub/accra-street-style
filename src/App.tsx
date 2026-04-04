import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import PublicLayout from "./components/PublicLayout";
import Index from "./pages/Index.tsx";
import Shop from "./pages/Shop.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";
import About from "./pages/About.tsx";
import Contact from "./pages/Contact.tsx";
import ReturnPolicy from "./pages/ReturnPolicy.tsx";
import Shipping from "./pages/Shipping.tsx";
import Privacy from "./pages/Privacy.tsx";
import Terms from "./pages/Terms.tsx";
import FAQ from "./pages/FAQ.tsx";
import SizeGuide from "./pages/SizeGuide.tsx";
import CustomPrints from "./pages/CustomPrints.tsx";
import CustomMockupStudio from "./pages/CustomMockupStudio.tsx";
import Checkout from "./pages/Checkout.tsx";
import PaymentStatus from "./pages/PaymentStatus.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminLogin from "./pages/admin/AdminLogin.tsx";
import AdminSignup from "./pages/admin/AdminSignup.tsx";
import AdminAnalytics from "./pages/admin/AdminAnalytics.tsx";
import AdminCollections from "./pages/admin/AdminCollections.tsx";
import AdminProducts from "./pages/admin/AdminProducts.tsx";
import AdminOrders from "./pages/admin/AdminOrders.tsx";
import AdminCarts from "./pages/admin/AdminCarts.tsx";
import AdminRoute from "./components/admin/AdminRoute.tsx";
import AdminLayout from "./components/admin/AdminLayout.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/returns" element={<ReturnPolicy />} />
              <Route path="/shipping" element={<Shipping />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/size-guide" element={<SizeGuide />} />
              <Route path="/custom-prints" element={<CustomPrints />} />
              <Route path="/custom-studio" element={<CustomMockupStudio />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment-status" element={<PaymentStatus />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/signup" element={<AdminSignup />} />
            <Route path="/admin" element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="analytics" replace />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="collections" element={<AdminCollections />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="carts" element={<AdminCarts />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
