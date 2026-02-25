import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">PRizm Beauty 利用規約</h1>
        <div className="bg-card rounded-2xl shadow-soft p-8 space-y-8 text-sm text-muted-foreground leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">第1条（定義）</h2>
            <p className="mb-2">本規約において使用する用語の定義は、以下のとおりとします。</p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>「当サービス」とは、「PRizm Beauty」という名称で当社が提供する、美容系インフルエンサーと美容ブランドをマッチングするプラットフォームサービスを指します。</li>
              <li>「当社」とは、当サービスを運営・提供する事業者を指します。</li>
              <li>「ユーザー」とは、当サービスに登録し、利用するすべての個人または法人を指します。</li>
              <li>「インフルエンサー」とは、SNS等で影響力を持ち、美容案件への応募・レビュー投稿を行うユーザーを指します。</li>
              <li>「ブランド」とは、美容商品・サービスの案件を掲載し、インフルエンサーへのPRを依頼する企業等のユーザーを指します。</li>
              <li>「案件」とは、ブランドが掲載する商品レビュー・PR投稿等の依頼内容を指します。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">第2条（適用）</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>本規約は、当サービスの利用に関する当社とユーザーとの間の一切の関係に適用されます。</li>
              <li>当社が当サービス上で掲載する利用に関するルール、ガイドライン等は、本規約の一部を構成するものとします。</li>
              <li>本規約の内容と前項のルール等の内容が矛盾する場合、特段の定めがない限り、本規約の規定が優先されます。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">第3条（登録）</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>当サービスの利用を希望する者は、本規約に同意の上、当社が定める方法により登録申請を行うものとします。</li>
              <li>当社は、登録申請者が以下の各号のいずれかに該当すると判断した場合、登録を拒否することができます。
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>本規約に違反したことがある者</li>
                  <li>登録情報に虚偽、誤記または記載漏れがあった場合</li>
                  <li>反社会的勢力等に該当する、または関与していると当社が判断した場合</li>
                  <li>その他、当社が登録を適当でないと判断した場合</li>
                </ul>
              </li>
              <li>ユーザーは、登録情報に変更があった場合、速やかに変更手続きを行うものとします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">第4条（アカウント管理）</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>ユーザーは、自己の責任において、アカウント情報（ID・パスワード等）を適切に管理・保管するものとし、第三者に利用させ、または貸与、譲渡、売買等してはなりません。</li>
              <li>アカウント情報の管理不十分、使用上の過誤、第三者の使用等による損害について、当社は一切の責任を負いません。</li>
              <li>ユーザーは、アカウント情報が盗用または第三者に使用されていることが判明した場合、直ちに当社にその旨を連絡するものとします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">第5条（利用料金）</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>インフルエンサーによる当サービスの基本利用は無料とします。</li>
              <li>ブランドによる案件掲載等については、当社が別途定める料金が発生する場合があります。</li>
              <li>当社は、利用料金を変更できるものとし、変更する場合は事前に通知します。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">第6条（案件への応募と契約）</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>インフルエンサーは、当サービス上に掲載された案件に応募することができます。</li>
              <li>ブランドは、応募したインフルエンサーの中から、自らの判断で選定を行います。</li>
              <li>案件の詳細条件（報酬額、納期、投稿内容等）は、ブランドとインフルエンサーの間で合意の上、決定されます。</li>
              <li>当社は、案件のマッチング機会を提供するプラットフォームであり、ブランドとインフルエンサー間の契約当事者とはなりません。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">第7条（報酬の支払）</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>インフルエンサーへの報酬は、案件の条件に基づき、当社を通じて支払われます。</li>
              <li>報酬の支払時期・方法は、当社が別途定める規定に従います。</li>
              <li>振込手数料その他の支払にかかる費用は、インフルエンサーの負担とします。</li>
              <li>報酬の支払に際し、源泉徴収等の税務処理が必要な場合、法令に従い適切に処理されます。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">第8条（禁止事項）</h2>
            <p className="mb-2">ユーザーは、当サービスの利用にあたり、以下の行為を行ってはなりません。</p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>虚偽または誤解を招く情報の登録・投稿</li>
              <li>当社、他のユーザーまたは第三者の知的財産権、肖像権、プライバシー権、名誉その他の権利を侵害する行為</li>
              <li>ステルスマーケティング等、景品表示法その他の法令に違反する投稿行為</li>
              <li>当サービスのネットワークまたはシステム等に過度な負荷をかける行為</li>
              <li>当社のサービス運営を妨害する行為</li>
              <li>不正アクセス、リバースエンジニアリング等の行為</li>
              <li>他のユーザーの情報を不正に収集・利用する行為</li>
              <li>反社会的勢力への利益供与行為</li>
              <li>その他、当社が不適切と判断する行為</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">第9条（サービスの停止・中断）</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>当社は、以下のいずれかに該当する場合、ユーザーへの事前通知なく、当サービスの全部または一部を停止・中断できるものとします。
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>システムの定期保守または緊急保守を行う場合</li>
                  <li>火災、停電、天災等の不可抗力により運営が困難になった場合</li>
                  <li>その他、当社が停止・中断が必要と判断した場合</li>
                </ul>
              </li>
              <li>当社は、前項に基づく停止・中断によりユーザーまたは第三者が被った損害について、一切の責任を負いません。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">第10条（利用制限・登録抹消）</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>当社は、ユーザーが以下のいずれかに該当する場合、事前通知なく、アカウントの利用制限または登録抹消を行うことができます。
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>本規約のいずれかの条項に違反した場合</li>
                  <li>登録情報に虚偽の事実があることが判明した場合</li>
                  <li>6ヶ月以上当サービスの利用がない場合</li>
                  <li>その他、当社が不適切と判断した場合</li>
                </ul>
              </li>
              <li>前項に基づく措置により生じた損害について、当社は一切の責任を負いません。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">第11条（コンテンツの権利）</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>ユーザーが当サービスに投稿・アップロードしたコンテンツ（レビュー、写真、動画等）の知的財産権は、ユーザーまたは権利を有する第三者に帰属します。</li>
              <li>ユーザーは、投稿コンテンツについて、当社に対し、世界的、非独占的、無償、サブライセンス可能、譲渡可能な使用権を許諾するものとします。</li>
              <li>ユーザーは、投稿コンテンツについて、当社および当社から権利を承継しまたは許諾された者に対し、著作者人格権を行使しないものとします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">第12条（免責事項）</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>当社は、当サービスが完全、正確、安全であること、エラーが発生しないことを保証しません。</li>
              <li>当社は、ブランドとインフルエンサー間のトラブル（報酬未払い、契約不履行等）について、一切の責任を負いません。</li>
              <li>当社は、ユーザーが投稿したコンテンツの内容について責任を負いません。</li>
              <li>当サービスに関連してユーザーと第三者との間で生じた紛争については、ユーザーの責任と費用で解決するものとし、当社は一切の責任を負いません。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">第13条（損害賠償）</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>ユーザーは、本規約違反により当社に損害を与えた場合、当社に対して一切の損害（弁護士費用を含む）を賠償する責任を負うものとします。</li>
              <li>当社の債務不履行または不法行為によりユーザーに損害が生じた場合、当社は、過去12ヶ月間にユーザーから受領した利用料金の総額を上限として損害賠償責任を負うものとします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">第14条（サービス内容の変更・終了）</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>当社は、ユーザーへの事前通知により、当サービスの内容を変更し、または終了することができます。</li>
              <li>当社は、前項に基づく変更・終了によりユーザーに生じた損害について、一切の責任を負いません。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">第15条（規約の変更）</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>当社は、必要に応じて本規約を変更できるものとします。</li>
              <li>変更後の規約は、当サービス上に掲載した時点より効力を生じるものとします。</li>
              <li>ユーザーは、変更後も当サービスを継続利用することにより、変更後の規約に同意したものとみなされます。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">第16条（連絡・通知）</h2>
            <p>当社からユーザーへの連絡・通知は、登録されたメールアドレスへの送信、または当サービス上での掲載により行います。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">第17条（準拠法・管轄裁判所）</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>本規約の準拠法は日本法とします。</li>
              <li>当サービスに関する一切の紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</li>
            </ol>
          </section>

          <p className="text-right text-muted-foreground pt-4 border-t border-border">制定日：2026年2月10日</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
