import { Link } from "react-router-dom";
import logoImg from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="inline-block">
              <img src={logoImg} alt="PRizm" className="h-8" />
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              美容インフルエンサーと企業をつなぐ<br />マッチングプラットフォーム
            </p>
          </div>

          {/* Service Links */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-foreground">サービス</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/campaigns" className="hover:text-primary transition-colors">案件を探す</Link></li>
              <li><Link to="/auth/login" className="hover:text-primary transition-colors">ログイン</Link></li>
              <li><Link to="/register" className="hover:text-primary transition-colors">新規登録</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-foreground">サポート</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/guide" className="hover:text-primary transition-colors">よくある質問</Link></li>
              <li><Link to="/guide" className="hover:text-primary transition-colors">お問い合わせ</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">利用規約</Link></li>
              <li><Link to="/privacy" className="hover:text-primary transition-colors">プライバシーポリシー</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-foreground">運営</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="https://pr-izm.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  PRizmについて
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} PRizm. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
