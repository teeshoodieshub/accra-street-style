import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAdminSession } from "@/hooks/use-admin-session";

const navItems = [
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/collections", label: "Collections" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/carts", label: "Carts" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { session } = useAdminSession();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border flex flex-col fixed inset-y-0 left-0 bg-background z-10">
        <div className="p-6 border-b border-border">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Admin</p>
          <h1 className="font-serif text-xl italic">TEES & HOODIES</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-4 py-3 text-xs uppercase tracking-[0.15em] transition-colors rounded-sm ${
                  isActive 
                    ? "bg-secondary text-foreground font-medium" 
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="mb-4 px-2">
            <p className="text-xs text-muted-foreground truncate" title={session?.user.email}>
              {session?.user.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 border border-border text-xs uppercase tracking-[0.15em] hover:bg-secondary transition-colors rounded-sm"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
