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
      { q: "フォロワーが少なくても登録できますか？", a: "はい、登録可能です。PRizm Beautyでは、フォロワー数よりもエンゲージメント率やコンテンツの質を重視しています。フォロワー数が少ない方向けの案件も多数ご用意しています。" },
      { q: "複数のSNSアカウントを登録できますか？", a: "はい、Instagram、TikTok、X（旧Twitter）、YouTubeなど、複数のSNSアカウントを登録できます。それぞれのアカウントで別々の案件に応募することも可能です。" },
      { q: "登録情報はどこから変更できますか？", a: "マイページの「アカウント設定」から、いつでも登録情報の変更が可能です。SNSアカウントの追加・削除も同じ画面から行えます。" },
      { q: "退会したい場合はどうすればいいですか？", a: "マイページの「アカウント設定」→「退会手続き」から退会申請ができます。ただし、実施中の案件がある場合は、案件完了後の退会となります。" },
    ],
  },
  {
    category: "案件応募について",
    id: "campaign",
    items: [
      { q: "案件に応募したらすべて採用されますか？", a: "いいえ、案件ごとに企業側が審査を行うため、応募しても必ず採用されるわけではありません。プロフィールの充実や過去の実績が採用率に影響します。" },
      { q: "応募の選考結果はいつ分かりますか？", a: "案件により異なりますが、通常は応募から3〜7営業日以内に結果が通知されます。急募案件の場合は、より早く結果が出ることもあります。" },
      { q: "同時に複数の案件に応募できますか？", a: "はい、複数の案件に同時に応募することができます。ただし、投稿期限や撮影日程が重ならないよう、スケジュール管理にご注意ください。" },
      { q: "採用後にキャンセルできますか？", a: "採用後のキャンセルは原則としてご遠慮いただいています。やむを得ない事情がある場合は、至急サポートチームまでご連絡ください。頻繁なキャンセルはアカウント評価に影響します。" },
      { q: "応募条件に「フォロワー○○人以上」とあるが、ギリギリ足りない場合は？", a: "条件を満たしていない場合でも、プロフィールの内容やエンゲージメント率次第では採用される可能性があります。まずは応募してみることをおすすめします。" },
    ],
  },
  {
    category: "報酬について",
    id: "reward",
    items: [
      { q: "報酬はいつ振り込まれますか？", a: "月末締め・翌月末払いとなります。例えば、1月中に投稿完了した案件の報酬は、2月末に振り込まれます。" },
      { q: "報酬の振込手数料はかかりますか？", a: "振込手数料は弊社が負担いたしますので、報酬から差し引かれることはありません。" },
      { q: "報酬が振り込まれない場合はどうすればいいですか？", a: "まずはマイページの「報酬履歴」で振込状況をご確認ください。確定済みなのに振り込まれていない場合は、サポートチームまでお問い合わせください。" },
      { q: "報酬の金額はどのように決まりますか？", a: "フォロワー数、エンゲージメント率、過去の実績、案件の内容などを総合的に判断して決定されます。同じ案件でも、インフルエンサーによって報酬額が異なる場合があります。" },
      { q: "確定申告は必要ですか？", a: "年間の報酬額が一定額を超える場合は、確定申告が必要になります。詳しくは税務署または税理士にご相談ください。弊社からは、年間の報酬額をまとめた支払調書を発行いたします。" },
    ],
  },
  {
    category: "投稿・実施について",
    id: "posting",
    items: [
      { q: "投稿の下書きを事前にチェックしてもらえますか？", a: "はい、投稿前に企業側に確認を依頼できる案件もあります。案件詳細ページで「投稿前確認あり」と記載されている場合は、必ず下書きを提出してください。" },
      { q: "投稿後に内容を修正できますか？", a: "軽微な修正（誤字脱字など）は可能ですが、大幅な内容変更は企業側の再確認が必要になる場合があります。投稿前の確認を徹底することをおすすめします。" },
      { q: "投稿を削除してもいいですか？", a: "案件で指定された掲載期間中は、投稿を削除することはできません。指定期間経過後も、できるだけ残しておくことが推奨されます。" },
      { q: "ストーリーズでの投稿も報酬対象になりますか？", a: "案件により異なります。ストーリーズのみの案件、フィード投稿のみの案件、両方必須の案件など、様々なパターンがあります。" },
      { q: "美容医療案件の施術は本当に無料ですか？", a: "はい、案件として採用された場合、施術費用は企業側が負担します。ただし、案件で指定された施術内容以外のオプションメニューを追加する場合は、自己負担となります。" },
    ],
  },
  {
    category: "トラブル・その他",
    id: "trouble",
    items: [
      { q: "商品が届かない、または破損していた場合は？", a: "すぐにサポートチームまでご連絡ください。商品の再送または代替案件のご提案をいたします。" },
      { q: "クリニックや店舗で不快な対応を受けた場合は？", a: "サポートチームまで詳細をご報告ください。今後の案件掲載の参考にさせていただきます。" },
      { q: "案件の内容と実際の商品・サービスが違った場合は？", a: "すぐにサポートチームにご連絡ください。状況を確認の上、適切な対応をいたします。" },
      { q: "他のインフルエンサーと報酬額を比較してもいいですか？", a: "報酬額は個別の契約内容となりますので、他のインフルエンサーとの比較・公開はお控えください。" },
      { q: "PRizm Beautyを通さずに企業と直接契約してもいいですか？", a: "PRizm Beautyを通じて知り合った企業との直接契約は、利用規約違反となります。継続的な取引をご希望の場合も、必ずPRizm Beauty経由でお取引ください。" },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Header />
      <main className="flex-1">
        <section className="bg-white py-12 md:py-20 border-b border-gray-100">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">よくある質問</h1>
            <p className="text-gray-500 max-w-2xl mx-auto">
              PRizm Beautyのご利用に関する<br className="md:hidden" />よくある質問をまとめました
            </p>
          </div>
        </section>

        <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20 overflow-x-auto">
          <div className="container mx-auto px-4">
            <div className="flex whitespace-nowrap md:justify-center gap-6 py-4 text-sm font-medium text-gray-600">
              {faqData.map((category) => (
                <button
                  key={category.id}
                  className="hover:text-pink-500 transition-colors"
                  onClick={() => document.getElementById(category.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                >
                  {category.category}
                </button>
              ))}
              <button
                className="hover:text-pink-500 transition-colors"
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                お問い合わせ
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-4xl space-y-16">
          {faqData.map((category) => (
            <section key={category.id} id={category.id} className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-gray-800 pb-2 border-b-2 border-pink-100">
                <span className="w-2 h-8 bg-pink-500 rounded-full"></span>
                {category.category}
              </h2>
              <div className="grid gap-6">
                {category.items.map((item, index) => (
                  <div key={index} className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex gap-4 mb-4">
                      <div className="w-8 h-8 shrink-0 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-bold font-serif">Q</div>
                      <h3 className="font-bold text-gray-900 pt-1 text-lg leading-snug">{item.q}</h3>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 shrink-0 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center font-bold font-serif">A</div>
                      <p className="text-gray-600 pt-1 leading-relaxed">{item.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <section id="contact" className="scroll-mt-24 pt-8">
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl p-8 md:p-12 text-center border border-purple-100">
              <h2 className="text-2xl font-bold mb-6 flex items-center justify-center gap-3 text-gray-900">
                <HelpCircle className="w-8 h-8 text-pink-500" />
                お問い合わせ
              </h2>
              <p className="text-gray-600 mb-8">
                上記で解決しない場合は、<br className="md:hidden" />以下の方法でお問い合わせください。
              </p>
              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-6 h-6 text-pink-600" />
                  </div>
                  <h3 className="font-bold mb-2 text-gray-900">チャットサポート</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    平日 10:00〜18:00<br />(土日祝を除く)<br />マイページ右下のチャットアイコンから
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-bold mb-2 text-gray-900">メールでのお問い合わせ</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-2">
                    24時間受付<br />(返信: 2〜3営業日以内)
                  </p>
                  <a href="mailto:media@pr-izm.com" className="text-pink-500 hover:text-pink-600 font-bold tracking-wide">
                    media@pr-izm.com
                  </a>
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
