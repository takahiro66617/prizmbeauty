export default function MyPageNotifications() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">お知らせ</h1>
      <div className="space-y-4">
        {[
          { id: 1, title: "システムメンテナンスのお知らせ", date: "2026.02.10", content: "2026年2月15日(木) AM 2:00〜4:00 の間、システムメンテナンスを実施いたします。" },
          { id: 2, title: "新機能「スカウト」が追加されました", date: "2026.02.05", content: "企業から直接オファーが届く「スカウト機能」がリリースされました。プロフィールの充実をおすすめします。" },
          { id: 3, title: "利用規約改定のお知らせ", date: "2026.02.01", content: "2026年2月1日付で利用規約を改定いたしました。設定ページよりご確認いただけます。" },
        ].map((news) => (
          <div key={news.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-gray-800">{news.title}</h3>
              <span className="text-sm text-gray-400">{news.date}</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{news.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
