export const CATEGORIES = [
  "スキンケア", "メイク", "ヘアケア", "ボディケア", "ネイル",
  "フレグランス", "ダイエット", "ファッション", "ライフスタイル",
  "ダンス", "グルメ", "旅行", "フィットネス", "ペット", "テクノロジー",
];

export const GENRES = [
  "ダンス", "Vlog", "美容・コスメ", "動物", "赤ちゃん・子ども",
  "カップル・夫婦", "お笑い", "アニメ・漫画", "芸能・エンタメ",
  "映画・ドラマ", "フィットネス・健康", "音楽", "お金・投資",
  "スポーツ", "ゲーム", "アート",
];

export const PLATFORMS = [
  "Instagram", "TikTok", "YouTube", "Twitter/X", "Facebook",
  "LINE VOOM", "Pinterest", "Threads", "note", "Ameba",
  "ブログ", "Snapchat", "LinkedIn", "Twitch",
];

export const APPLICATION_STATUSES = [
  { id: "applied", label: "新規応募", color: "bg-blue-100 text-blue-700" },
  { id: "reviewing", label: "選考中", color: "bg-yellow-100 text-yellow-700" },
  { id: "approved", label: "採用", color: "bg-green-100 text-green-700" },
  { id: "rejected", label: "不採用", color: "bg-red-100 text-red-700" },
  { id: "in_progress", label: "進行中", color: "bg-purple-100 text-purple-700" },
  { id: "post_submitted", label: "投稿済み", color: "bg-indigo-100 text-indigo-700" },
  { id: "post_confirmed", label: "投稿確認済", color: "bg-teal-100 text-teal-700" },
  { id: "payment_pending", label: "振込待ち", color: "bg-orange-100 text-orange-700" },
  { id: "completed", label: "完了", color: "bg-gray-100 text-gray-700" },
];

export const CAMPAIGN_STATUSES = [
  { id: "draft", label: "下書き", color: "bg-gray-100 text-gray-600" },
  { id: "recruiting", label: "募集中", color: "bg-green-100 text-green-700" },
  { id: "closed", label: "終了", color: "bg-red-100 text-red-700" },
  { id: "completed", label: "完了", color: "bg-blue-100 text-blue-700" },
];

export const INFLUENCER_STATUSES = [
  { id: "pending", label: "審査中", color: "bg-yellow-100 text-yellow-700" },
  { id: "approved", label: "承認済み", color: "bg-green-100 text-green-700" },
  { id: "active", label: "有効", color: "bg-blue-100 text-blue-700" },
  { id: "suspended", label: "停止中", color: "bg-orange-100 text-orange-700" },
  { id: "rejected", label: "却下", color: "bg-red-100 text-red-700" },
];

export const COMPANY_STATUSES = [
  { id: "active", label: "契約中", color: "bg-green-50 text-green-700" },
  { id: "pending", label: "承認待ち", color: "bg-yellow-50 text-yellow-700" },
  { id: "suspended", label: "停止中", color: "bg-red-50 text-red-700" },
];

export const INDUSTRIES = [
  "化粧品", "アパレル", "食品", "飲料", "健康食品",
  "美容サロン", "医療", "テクノロジー", "不動産", "旅行",
  "教育", "エンタメ", "スポーツ", "金融", "その他",
];
