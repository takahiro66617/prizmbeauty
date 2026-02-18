import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MOCK_CAMPAIGNS } from "@/lib/mockData";
import { Heart, Clock, Users, CheckCircle, Instagram, Youtube } from "lucide-react";

export default function CampaignDetail() {
  const { id } = useParams();
  const campaign = MOCK_CAMPAIGNS.find(c => c.id === id);

  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">案件が見つかりません</h1>
            <Link to="/campaigns"><Button>一覧に戻る</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
          <Link to="/campaigns" className="hover:text-primary transition-colors">案件一覧</Link>
          <span>/</span>
          <span className="text-foreground line-clamp-1">{campaign.title}</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Image */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-soft">
              <img src={campaign.images[0]} alt={campaign.title} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-card/90 backdrop-blur rounded-full text-sm font-bold shadow-sm">{campaign.category}</span>
              </div>
            </div>

            {/* Title */}
            <div className="bg-card p-8 rounded-2xl shadow-soft">
              <h1 className="text-2xl md:text-3xl font-bold mb-4">{campaign.title}</h1>
              <div className="flex items-center gap-4 py-4 border-t border-b border-border">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center font-bold text-xl text-muted-foreground">
                  {campaign.company.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">掲載企業</div>
                  <div className="font-bold">{campaign.company.name}</div>
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-bold mb-4">案件内容</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{campaign.description}</p>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-card p-8 rounded-2xl shadow-soft space-y-6">
              <h3 className="text-lg font-bold">応募要件・条件</h3>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-pastel-pink/30 flex items-center justify-center shrink-0 text-primary"><CheckCircle className="w-5 h-5" /></div>
                <div>
                  <h4 className="font-bold mb-2">応募資格</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    {campaign.requirements.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-pastel-blue/30 flex items-center justify-center shrink-0 text-accent-foreground"><Instagram className="w-5 h-5" /></div>
                <div>
                  <h4 className="font-bold mb-2">投稿プラットフォーム</h4>
                  <div className="flex gap-2 flex-wrap">
                    {campaign.platforms.includes("instagram") && <span className="px-3 py-1 bg-pastel-pink/20 text-primary rounded-full text-sm flex items-center gap-1"><Instagram className="w-4 h-4" /> Instagram</span>}
                    {campaign.platforms.includes("youtube") && <span className="px-3 py-1 bg-destructive/10 text-destructive rounded-full text-sm flex items-center gap-1"><Youtube className="w-4 h-4" /> YouTube</span>}
                    {campaign.platforms.includes("tiktok") && <span className="px-3 py-1 bg-muted rounded-full text-sm font-bold">TikTok</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-pastel-purple/30 flex items-center justify-center shrink-0"><CheckCircle className="w-5 h-5 text-secondary-foreground" /></div>
                <div>
                  <h4 className="font-bold mb-2">納品物</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    {campaign.deliverables.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-0 shadow-lg overflow-hidden">
              <div className="gradient-pink-blue p-6 border-b border-border/30">
                <div className="text-sm text-white/80 mb-1">報酬金額</div>
                <div className="text-3xl font-bold text-white">¥{campaign.reward.toLocaleString()}<span className="text-base font-normal ml-1">~</span></div>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground"><Users className="w-4 h-4" /> 募集人数</span>
                    <span className="font-bold">{campaign.maxApplicants}名</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${(campaign.currentApplicants / campaign.maxApplicants) * 100}%` }} />
                  </div>
                  <div className="text-xs text-right text-muted-foreground">現在 {campaign.currentApplicants}名が応募済み</div>
                </div>
                <div className="flex justify-between items-center text-sm pt-4 border-t border-border">
                  <span className="flex items-center gap-2 text-muted-foreground"><Clock className="w-4 h-4" /> 応募締切</span>
                  <span className="font-bold text-destructive">{new Date(campaign.deadline).toLocaleDateString("ja-JP")}</span>
                </div>
                <div className="space-y-3 pt-4">
                  <Button className="w-full h-12 text-lg" variant="gradient">この案件に応募する</Button>
                  <Button variant="outline" className="w-full h-12 hover:bg-pastel-pink/10 hover:text-primary hover:border-primary/30">
                    <Heart className="w-4 h-4 mr-2" /> お気に入りに追加
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground">応募にはPRizm Beautyへの会員登録が必要です</p>
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
