import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { useAdminSession } from "@/hooks/use-admin-session";

export default function AdminSignup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useAdminSession();

  useEffect(() => {
    if (session) {
      navigate("/admin/products", { replace: true });
    }
  }, [navigate, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", description: "Please re-enter your password." });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      toast({ title: "Signup failed", description: error.message });
      return;
    }

    toast({
      title: "Check your email",
      description: "We sent a confirmation link to finish creating your admin account.",
    });
    navigate("/admin/login", { replace: true });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-secondary/40">
      <div className="w-full max-w-md bg-background border border-border p-8">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin Access</p>
          <h1 className="font-serif text-2xl italic mt-2">Create Account</h1>
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
              minLength={8}
            />
          </label>
          <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Confirm Password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2 w-full h-12 px-3 border border-border bg-transparent text-sm focus:outline-none focus:border-foreground"
              required
              minLength={8}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-foreground text-primary-foreground text-xs uppercase tracking-[0.15em] font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Already have access?{" "}
          <Link to="/admin/login" className="text-foreground hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
