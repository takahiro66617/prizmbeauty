import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MOCK_CAMPAIGNS } from "@/lib/mockData";
import { ArrowRight, Sparkles, Search, HandshakeIcon } from "lucide-react";
import heroSkincare from "@/assets/hero-skincare.jpg";
import heroFacial from "@/assets/hero-facial.jpg";
import heroMakeup from "@/assets/hero-makeup.jpg";

const heroImages = [heroSkincare, heroFacial, heroMakeup];
const heroLabels = ["スキンケア", "フェイシャル", "メイクアップ"];

const HeroSection = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((p) => (p + 1) % heroImages.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden h-[500px] md:h-[600px]">
      {heroImages.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={heroLabels[i]}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === current ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
      <div className="container mx-auto px-4 relative z-10 h-full flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-white drop-shadow-lg">
          <span className="gradient-text">あなたの美しさ</span>を
          <br />
          <span className="gradient-text">価値</span>に変える
        </h1>
        <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow">
          PRizm Beautyは美容インフルエンサーと企業をつなぐ
          <br className="hidden md:block" />
          マッチングプラットフォームです
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/campaigns">
            <Button variant="gradient" size="lg" className="text-base px-8">
              案件を探す <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="outline" size="lg" className="text-base px-8 bg-white/20 backdrop-blur border-white/30 text-white hover:bg-white/30">
              無料で新規登録
            </Button>
          </Link>
        </div>
        <div className="flex gap-2 mt-8">
          {heroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? "bg-white scale-125" : "bg-white/50"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const Index = () => {
  const featuredCampaigns = MOCK_CAMPAIGNS.slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection />


        {/* How it works */}
        <section className="py-20 bg-card">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
              <span className="gradient-text">3ステップ</span>ではじめる
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              カンタンに美容案件を見つけて報酬を得られます
            </p>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                {
                  icon: Sparkles,
                  step: "01",
                  title: "無料登録",
                  desc: "SNSアカウントと基本情報を登録するだけ。審査不要ですぐに始められます。",
                },
                {
                  icon: Search,
                  step: "02",
                  title: "案件を探す",
                  desc: "美容・コスメの案件から、あなたにぴったりのものを見つけましょう。",
                },
                {
                  icon: HandshakeIcon,
                  step: "03",
                  title: "応募＆報酬GET",
                  desc: "案件に応募して承認されたら、投稿して報酬を受け取りましょう。",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="text-center p-8 rounded-2xl bg-background shadow-soft hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  <div className="w-14 h-14 rounded-full gradient-pink-blue flex items-center justify-center mx-auto mb-5">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-xs font-bold text-primary mb-2">STEP {item.step}</div>
                  <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Campaigns */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">
                  注目の<span className="gradient-text">案件</span>
                </h2>
                <p className="text-muted-foreground text-sm mt-1">人気の美容案件をチェック</p>
              </div>
              <Link to="/campaigns">
                <Button variant="outline" size="sm">
                  すべて見る <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {featuredCampaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  to={`/campaigns/${campaign.id}`}
                  className="group bg-card rounded-2xl shadow-soft overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all"
                >
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img
                      src={campaign.images[0]}
                      alt={campaign.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <span className="inline-block px-2.5 py-0.5 bg-pastel-pink/30 text-primary text-xs font-bold rounded-full mb-2">
                      {campaign.category}
                    </span>
                    <h3 className="font-bold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                      {campaign.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">{campaign.company.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        ¥{campaign.reward.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        〜{new Date(campaign.deadline).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-r from-pastel-pink/30 via-pastel-purple/20 to-pastel-blue/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              今すぐ<span className="gradient-text">PRizm Beauty</span>をはじめよう
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              登録は無料。あなたの美容の知識と影響力を活かして、新しい収入源を見つけましょう。
            </p>
            <Link to="/register">
              <Button variant="gradient" size="lg" className="text-base px-10">
                無料で新規登録 <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
