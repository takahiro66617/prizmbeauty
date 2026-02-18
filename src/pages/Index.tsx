import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { FlowSection } from "@/components/home/FlowSection";
import { useExternalCampaigns } from "@/hooks/useExternalCampaigns";
import { ArrowRight, Heart, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { data: campaigns = [] } = useExternalCampaigns();

  const featuredCampaigns = campaigns
    .filter(c => c.status === "recruiting")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
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

            {featuredCampaigns.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {featuredCampaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    to={`/campaigns/${campaign.id}`}
                    className="group bg-card rounded-2xl shadow-soft overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all"
                  >
                    <div className="aspect-video bg-muted overflow-hidden relative">
                      {campaign.image_url ? (
                        <img
                          src={campaign.image_url}
                          alt={campaign.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <FileText className="w-8 h-8" />
                        </div>
                      )}
                      <button
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
                        onClick={(e) => e.preventDefault()}
                      >
                        <Heart className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="p-4">
                      {campaign.category && (
                        <span className="inline-block px-2.5 py-0.5 bg-pastel-pink/30 text-primary text-xs font-bold rounded-full mb-2">
                          {campaign.category}
                        </span>
                      )}
                      <h3 className="font-bold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {campaign.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2">{campaign.companies?.name || ""}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-primary">
                          ¥{(campaign.budget_max || campaign.budget_min || 0).toLocaleString()}
                        </span>
                        {campaign.deadline && (
                          <span className="text-xs text-muted-foreground">
                            〜{new Date(campaign.deadline).toLocaleDateString("ja-JP")}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>現在募集中の案件はまだありません</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
