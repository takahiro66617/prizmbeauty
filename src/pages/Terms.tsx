import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">利用規約</h1>
        <div className="bg-card rounded-2xl shadow-soft p-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">第1条（適用）</h2>
            <p>本規約は、PRizm Beauty（以下「本サービス」）の利用に関する条件を定めるものです。ユーザーは本規約に同意の上、本サービスを利用するものとします。</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">第2条（登録）</h2>
            <p>本サービスの利用を希望する方は、所定の方法により利用登録を行うものとします。当社は、登録を承認した場合にアカウントを発行します。</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">第3条（禁止事項）</h2>
            <p>ユーザーは、本サービスの利用にあたり、法令違反、当社または第三者の権利侵害、虚偽情報の提供、本サービスを介さない直接取引等を行ってはなりません。</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">第4条（報酬）</h2>
            <p>報酬は月末締め・翌月末払いとします。振込手数料は当社が負担します。</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
