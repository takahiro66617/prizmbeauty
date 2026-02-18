import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="text-lg font-bold gradient-text">
              PRizm Beauty
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
              <li><Link to="/guide" className="hover:text-primary transition-colors">利用ガイド</Link></li>
              <li><Link to="/auth/login" className="hover:text-primary transition-colors">ログイン</Link></li>
              <li><Link to="/register" className="hover:text-primary transition-colors">新規登録</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-foreground">法的情報</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/terms" className="hover:text-primary transition-colors">利用規約</Link></li>
              <li><Link to="/privacy" className="hover:text-primary transition-colors">プライバシーポリシー</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-foreground">お問い合わせ</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="mailto:media@pr-izm.com" className="hover:text-primary transition-colors">
                  media@pr-izm.com
                </a>
              </li>
              <li className="text-xs">平日 10:00〜18:00</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          © 2026 PRizm Beauty. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
