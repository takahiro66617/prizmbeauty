import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">プライバシーポリシー</h1>
        <div className="bg-card rounded-2xl shadow-soft p-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">1. 個人情報の取得</h2>
            <p>当社は、サービスの提供にあたり、以下の個人情報を取得します。氏名、メールアドレス、SNSアカウント情報、プロフィール情報、銀行口座情報（報酬振込のため）。</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">2. 利用目的</h2>
            <p>取得した個人情報は、サービスの提供・改善、案件のマッチング、報酬の支払い、お知らせの送付などに利用します。</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">3. 第三者提供</h2>
            <p>法令に基づく場合を除き、ご本人の同意なく個人情報を第三者に提供することはありません。ただし、案件マッチングのため、企業にプロフィール情報を共有する場合があります。</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">4. お問い合わせ</h2>
            <p>個人情報の取扱いに関するお問い合わせは、media@pr-izm.com までご連絡ください。</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
