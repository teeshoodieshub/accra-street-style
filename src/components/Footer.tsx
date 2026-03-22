import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <h3 className="font-serif text-xl font-semibold tracking-wide mb-4 text-lift-hover">TEES & HOODIES</h3>
            <p className="text-primary-foreground/60 text-sm max-w-xs leading-relaxed">
              Streetwear born in Accra. Where modern elegance meets heritage craft.
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold mb-4">Collections</p>
            <div className="flex flex-col gap-2">
              {[
                { to: "/shop", label: "Graphic Tees" },
                { to: "/shop", label: "Hoodies" },
                { to: "/shop", label: "Sleeveless" },
              ].map((link) => (
                <Link key={link.label} to={link.to} className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors link-underline-fx">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold mb-4">Company</p>
            <div className="flex flex-col gap-2">
              {[
                { to: "/about", label: "About Us" },
                { to: "/contact", label: "Contact" },
              ].map((link) => (
                <Link key={link.to} to={link.to} className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors link-underline-fx">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold mb-4">Get in Touch</p>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-primary-foreground/60">West Africa</p>
              <a href="mailto:hello@teesandhoodies.com" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors link-underline-fx">
                hello@teesandhoodies.com
              </a>
            </div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-primary-foreground/10">
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary-foreground/30">© 2026 Tees & Hoodies. Designed in Accra, Ghana.</p>
        </div>
      </div>
    </footer>
  );
}
