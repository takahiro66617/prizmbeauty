import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { FlowSection } from "@/components/home/FlowSection";
import { MOCK_CAMPAIGNS } from "@/lib/mockData";
import { ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const featuredCampaigns = [...MOCK_CAMPAIGNS]
    .sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime())
    .slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <FlowSection />

        {/* Popular Campaigns - 4 columns */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">
                  人気の<span className="gradient-text">新着案件</span>
                </h2>
                <p className="text-muted-foreground text-sm mt-1">最新の美容案件をチェック</p>
              </div>
              <Link to="/campaigns">
                <Button variant="outline" size="sm">
                  すべて見る <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {featuredCampaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  to={`/campaigns/${campaign.id}`}
                  className="group bg-card rounded-2xl shadow-soft overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all"
                >
                  <div className="aspect-video bg-muted overflow-hidden relative">
                    <img
                      src={campaign.images[0]}
                      alt={campaign.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Heart className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="p-4">
                    <span className="inline-block px-2.5 py-0.5 bg-pastel-pink/30 text-primary text-xs font-bold rounded-full mb-2">
                      {campaign.category}
                    </span>
                    <h3 className="font-bold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                      {campaign.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">{campaign.company.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-primary">
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
      </main>

      <Footer />
    </div>
  );
};

export default Index;
