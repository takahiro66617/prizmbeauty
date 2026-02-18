import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HelpCircle, Mail, MessageCircle } from "lucide-react";

const faqData = [
  {
    category: "登録・アカウントについて",
    id: "account",
    items: [
      { q: "登録に費用はかかりますか？", a: "いいえ、PRizm Beautyの登録・利用は完全無料です。登録費用や月額料金などは一切かかりません。" },
      { q: "フォロワーが少なくても登録できますか？", a: "はい、登録可能です。PRizm Beautyでは、フォロワー数よりもエンゲージメント率やコンテンツの質を重視しています。" },
      { q: "複数のSNSアカウントを登録できますか？", a: "はい、Instagram、TikTok、X、YouTubeなど、複数のSNSアカウントを登録できます。" },
    ],
  },
  {
    category: "案件応募について",
    id: "campaign",
    items: [
      { q: "案件に応募したらすべて採用されますか？", a: "いいえ、案件ごとに企業側が審査を行うため、応募しても必ず採用されるわけではありません。" },
      { q: "同時に複数の案件に応募できますか？", a: "はい、複数の案件に同時に応募することができます。" },
      { q: "応募の選考結果はいつ分かりますか？", a: "通常は応募から3〜7営業日以内に結果が通知されます。" },
    ],
  },
  {
    category: "報酬について",
    id: "reward",
    items: [
      { q: "報酬はいつ振り込まれますか？", a: "月末締め・翌月末払いとなります。" },
      { q: "報酬の振込手数料はかかりますか？", a: "振込手数料は弊社が負担いたします。" },
      { q: "確定申告は必要ですか？", a: "年間の報酬額が一定額を超える場合は、確定申告が必要になります。" },
    ],
  },
  {
    category: "投稿・実施について",
    id: "posting",
    items: [
      { q: "投稿の下書きを事前にチェックしてもらえますか？", a: "案件によっては投稿前に企業側に確認を依頼できます。" },
      { q: "投稿を削除してもいいですか？", a: "案件で指定された掲載期間中は、投稿を削除することはできません。" },
    ],
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-card py-16 border-b border-border">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">よくある質問</h1>
            <p className="text-muted-foreground">PRizm Beautyのご利用に関するよくある質問をまとめました</p>
          </div>
        </section>

        {/* Nav */}
        <div className="bg-card border-b border-border shadow-sm sticky top-16 z-20 overflow-x-auto">
          <div className="container mx-auto px-4 flex md:justify-center gap-6 py-3 text-sm font-medium text-muted-foreground">
            {faqData.map(cat => (
              <button key={cat.id} className="hover:text-primary transition-colors whitespace-nowrap" onClick={() => document.getElementById(cat.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                {cat.category}
              </button>
            ))}
            <button className="hover:text-primary transition-colors whitespace-nowrap" onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
              お問い合わせ
            </button>
          </div>
        </div>

        {/* FAQ Content */}
        <div className="container mx-auto px-4 py-12 max-w-4xl space-y-16">
          {faqData.map(cat => (
            <section key={cat.id} id={cat.id} className="scroll-mt-32">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 pb-2 border-b-2 border-pastel-pink/50">
                <span className="w-2 h-8 bg-primary rounded-full" />
                {cat.category}
              </h2>
              <div className="space-y-6">
                {cat.items.map((item, i) => (
                  <div key={i} className="bg-card p-6 md:p-8 rounded-2xl border border-border shadow-soft hover:shadow-md transition-shadow">
                    <div className="flex gap-4 mb-4">
                      <div className="w-8 h-8 shrink-0 bg-pastel-pink/30 text-primary rounded-full flex items-center justify-center font-bold">Q</div>
                      <h3 className="font-bold pt-1 text-lg leading-snug">{item.q}</h3>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 shrink-0 bg-muted text-muted-foreground rounded-full flex items-center justify-center font-bold">A</div>
                      <p className="text-muted-foreground pt-1 leading-relaxed">{item.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Contact */}
          <section id="contact" className="scroll-mt-32 pt-8">
            <div className="bg-gradient-to-br from-pastel-pink/20 to-pastel-purple/20 rounded-3xl p-8 md:p-12 text-center border border-pastel-purple/30">
              <h2 className="text-2xl font-bold mb-6 flex items-center justify-center gap-3">
                <HelpCircle className="w-8 h-8 text-primary" /> お問い合わせ
              </h2>
              <p className="text-muted-foreground mb-8">上記で解決しない場合は、以下の方法でお問い合わせください。</p>
              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <div className="bg-card p-6 rounded-xl border border-border shadow-soft">
                  <div className="w-12 h-12 bg-pastel-pink/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">チャットサポート</h3>
                  <p className="text-sm text-muted-foreground">平日 10:00〜18:00<br />(土日祝を除く)</p>
                </div>
                <div className="bg-card p-6 rounded-xl border border-border shadow-soft">
                  <div className="w-12 h-12 bg-pastel-purple/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <h3 className="font-bold mb-2">メール</h3>
                  <p className="text-sm text-muted-foreground mb-2">24時間受付（返信: 2〜3営業日）</p>
                  <a href="mailto:media@pr-izm.com" className="text-primary font-bold">media@pr-izm.com</a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
