import { Search, Users, Camera, Gift } from "lucide-react";

const steps = [
  { icon: Search, title: "案件を探す", desc: "あなたに合った美容案件を検索" },
  { icon: Users, title: "マッチング", desc: "企業とのマッチングが成立" },
  { icon: Camera, title: "商品体験・投稿", desc: "商品を体験してSNSに投稿" },
  { icon: Gift, title: "報酬獲得", desc: "投稿完了後に報酬をお受け取り" },
];

export function FlowSection() {
  return (
    <section className="py-20 bg-gradient-to-r from-pastel-pink/30 via-pastel-purple/20 to-pastel-blue/30">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
          ご利用の<span className="gradient-text">流れ</span>
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          4つのステップで簡単に始められます
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto relative">
          {steps.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center">
              {/* Connector line (not on last item) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r from-pastel-pink to-pastel-blue" />
              )}

              <div className="w-16 h-16 rounded-full gradient-pink-blue flex items-center justify-center mb-4 relative z-10 shadow-md">
                <step.icon className="w-7 h-7 text-white" />
              </div>
              <div className="text-xs font-bold text-primary mb-1">STEP {String(i + 1).padStart(2, "0")}</div>
              <h3 className="font-bold text-sm mb-1 text-card-foreground">{step.title}</h3>
              <p className="text-xs text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
