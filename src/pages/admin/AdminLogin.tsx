import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { useAdminSession } from "@/hooks/use-admin-session";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAdminSession();

  const from = (location.state as { from?: Location })?.from?.pathname || "/admin/products";

  useEffect(() => {
    if (session) {
      navigate(from, { replace: true });
    }
  }, [from, navigate, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message });
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-secondary/40">
      <div className="w-full max-w-md bg-background border border-border p-8">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin Access</p>
          <h1 className="font-serif text-2xl italic mt-2">Sign In</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full h-12 px-3 border border-border bg-transparent text-sm focus:outline-none focus:border-foreground"
              required
            />
          </label>
          <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full h-12 px-3 border border-border bg-transparent text-sm focus:outline-none focus:border-foreground"
              required
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-foreground text-primary-foreground text-xs uppercase tracking-[0.15em] font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Need an admin account?{" "}
          <Link to="/admin/signup" className="text-foreground hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
