import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "案件を探す", href: "/campaigns" },
  { label: "利用ガイド", href: "/guide" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1">
          <h1 className="text-xl font-bold gradient-text">PRizm Beauty</h1>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === item.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/auth/login">
            <Button
              className="h-10 px-5 font-bold text-white border-0"
              style={{ backgroundColor: "#06C755" }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1">
                <path d="M21.5 10.8C21.5 5.8 17.2 1.8 12 1.8C6.8 1.8 2.5 5.8 2.5 10.8C2.5 14.8 5 18.3 8.8 19.3C9 19.4 9.2 19.9 9.1 20.4C9 20.9 8.8 21.8 8.8 21.8C8.8 21.8 8.7 22.1 8.9 22.2C9.1 22.3 9.4 22.2 9.4 22.2C10.4 22 14.2 19.4 14.8 19.1C18.6 18.5 21.5 15 21.5 10.8Z" />
              </svg>
              LINEでログイン
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-card border-t border-border px-4 py-4 space-y-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="block text-sm font-medium text-muted-foreground hover:text-primary"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/auth/login" onClick={() => setMobileOpen(false)}>
            <Button
              className="w-full h-10 font-bold text-white border-0"
              style={{ backgroundColor: "#06C755" }}
            >
              LINEでログイン
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
