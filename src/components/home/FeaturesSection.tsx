import { DollarSign, TrendingUp, Shield } from "lucide-react";

const features = [
  {
    point: "01",
    icon: DollarSign,
    title: "完全無料",
    desc: "登録料・利用料は一切かかりません。気軽に始められるので、初めての方でも安心です。",
  },
  {
    point: "02",
    icon: TrendingUp,
    title: "キャリアアップ",
    desc: "有名ブランドとのコラボ実績を積んで、インフルエンサーとしてのキャリアを築けます。",
  },
  {
    point: "03",
    icon: Shield,
    title: "安心のサポート",
    desc: "専任スタッフが案件の進行をサポート。トラブル時も安心してご利用いただけます。",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
          <span className="gradient-text">PRizm Beauty</span>の特徴
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          インフルエンサーの皆さまに選ばれる理由
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((item) => (
            <div
              key={item.point}
              className="relative p-8 rounded-[2rem] bg-background shadow-soft hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden"
            >
              {/* Point label - vertical */}
              <div className="absolute top-4 right-4 text-xs font-bold text-pastel-purple/60 tracking-widest"
                style={{ writingMode: "vertical-rl" }}
              >
                Point {item.point}
              </div>

              {/* Gradient icon background */}
              <div className="w-16 h-16 rounded-2xl gradient-pink-blue flex items-center justify-center mb-6">
                <item.icon className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-lg font-bold mb-3 text-card-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
