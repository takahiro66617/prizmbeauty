import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import lineIcon from "@/assets/line.png";

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
              <img src={lineIcon} alt="LINE" className="w-5 h-5 mr-1" />
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
