import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FileText, Clock, CheckCircle, TrendingUp, ArrowRight, LogOut } from "lucide-react";
import { MOCK_CAMPAIGNS } from "@/lib/mockData";

export default function MyPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("currentUser");
    if (!stored) {
      navigate("/auth/login");
      return;
    }
    setUser(JSON.parse(stored));
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("currentUser");
    navigate("/");
  };

  if (!user) return null;

  const stats = [
    { label: "応募数", value: "12", icon: FileText, color: "bg-pastel-pink/30 text-primary" },
    { label: "進行中", value: "3", icon: Clock, color: "bg-pastel-blue/30 text-accent-foreground" },
    { label: "完了", value: "8", icon: CheckCircle, color: "bg-pastel-purple/30 text-secondary-foreground" },
    { label: "総収益", value: "¥285,000", icon: TrendingUp, color: "bg-green-100 text-green-600" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* User Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img src={user.profileImagePreview} alt={user.name} className="w-14 h-14 rounded-full border-2 border-pastel-pink" />
            <div>
              <h1 className="text-xl font-bold">{user.name}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-1" /> ログアウト
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <Card key={s.label} className="p-5 border-0 shadow-soft">
              <div className={`w-10 h-10 rounded-full ${s.color} flex items-center justify-center mb-3`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </Card>
          ))}
        </div>

        {/* Active Campaigns */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">進行中の案件</h2>
            <Link to="/campaigns"><Button variant="outline" size="sm">すべて見る</Button></Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {MOCK_CAMPAIGNS.slice(0, 2).map(c => (
              <Card key={c.id} className="p-4 border-0 shadow-soft flex gap-4 hover:shadow-md transition-shadow">
                <img src={c.images[0]} alt={c.title} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm line-clamp-1">{c.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{c.company.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-bold text-sm">¥{c.reward.toLocaleString()}</span>
                    <Link to={`/campaigns/${c.id}`}><Button variant="ghost" size="sm">詳細 <ArrowRight className="w-3 h-3 ml-1" /></Button></Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "案件を探す", href: "/campaigns" },
            { label: "利用ガイド", href: "/guide" },
            { label: "プロフィール設定", href: "/mypage" },
            { label: "お知らせ", href: "/mypage" },
          ].map(link => (
            <Link key={link.label} to={link.href}>
              <Card className="p-4 border-0 shadow-soft text-center hover:shadow-md transition-shadow cursor-pointer">
                <span className="text-sm font-medium">{link.label}</span>
              </Card>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
