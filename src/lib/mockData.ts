// PRizm Beauty Mock Data

export interface Company {
  id: string;
  name: string;
  logo?: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  address: string;
  status: "active" | "suspended" | "pending";
  createdAt: string;
}

export interface Influencer {
  id: string;
  name: string;
  username: string;
  email: string;
  image: string;
  platforms: { instagram?: number; tiktok?: number; youtube?: number };
  categories: string[];
  status: "approved" | "reviewing" | "suspended";
  joinedAt: string;
}

export interface Application {
  id: string;
  campaignId: string;
  influencerId: string;
  companyId: string;
  status: "applied" | "reviewing" | "approved" | "rejected" | "completed";
  motivation: string;
  appliedAt: string;
  reviewedAt?: string;
  reviewComment?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderType: "company" | "influencer" | "admin";
  receiverId: string;
  receiverType: "company" | "influencer" | "admin";
  subject: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  company: { id: string; name: string; logo?: string };
  category: string;
  images: string[];
  reward: number;
  maxApplicants: number;
  currentApplicants: number;
  deadline: string;
  requirements: string[];
  platforms: string[];
  deliverables: string[];
  status: "recruiting" | "closed" | "finished";
  createdAt: string;
}

export const CATEGORIES = [
  "スキンケア", "メイク", "ヘアケア",
  "ボディケア", "ネイル", "フレグランス",
  "ダイエット", "ファッション", "ライフスタイル"
];

// ========== Companies ==========
export const MOCK_COMPANIES: Company[] = [
  { id: "c1", name: "ルミエール・コスメティック", contactName: "山田 太郎", contactRole: "マーケティング部長", email: "yamada@lumiere.co.jp", phone: "03-1234-5678", address: "東京都渋谷区神南1-2-3", status: "active", createdAt: "2025-10-01" },
  { id: "c2", name: "ナチュラルビューティー株式会社", contactName: "鈴木 花子", contactRole: "PR担当", email: "suzuki@naturalbeauty.jp", phone: "03-2345-6789", address: "東京都港区南青山4-5-6", status: "active", createdAt: "2025-11-15" },
  { id: "c3", name: "Bloom Cosmetics", contactName: "佐藤 由紀", contactRole: "ブランドマネージャー", email: "sato@bloom.co.jp", phone: "03-3456-7890", address: "東京都目黒区中目黒7-8-9", status: "active", createdAt: "2025-12-01" },
  { id: "c4", name: "ピュアスキン・ジャパン", contactName: "高橋 健一", contactRole: "営業部", email: "takahashi@pureskin.jp", phone: "03-4567-8901", address: "東京都新宿区西新宿10-11-12", status: "active", createdAt: "2026-01-05" },
  { id: "c5", name: "グランネイル", contactName: "中村 美穂", contactRole: "店長", email: "nakamura@grannail.jp", phone: "03-5678-9012", address: "東京都渋谷区表参道13-14-15", status: "pending", createdAt: "2026-01-20" },
  { id: "c6", name: "Maison de Parfum", contactName: "ジャン・ピエール", contactRole: "日本支社長", email: "jp@maisonparfum.com", phone: "03-6789-0123", address: "東京都千代田区丸の内16-17-18", status: "active", createdAt: "2026-02-01" },
];

// ========== Influencers ==========
export const MOCK_INFLUENCERS: Influencer[] = [
  { id: "inf_001", name: "田中 美咲", username: "misaki_beauty", email: "misaki@example.com", image: "https://ui-avatars.com/api/?name=美咲&background=FFD6E8&color=333", platforms: { instagram: 15000, tiktok: 8000 }, categories: ["スキンケア", "メイク"], status: "approved", joinedAt: "2026-01-10" },
  { id: "inf_002", name: "佐藤 あいり", username: "airi_cosme", email: "airi@example.com", image: "https://ui-avatars.com/api/?name=あいり&background=D6E8FF&color=333", platforms: { instagram: 25000, youtube: 12000 }, categories: ["メイク", "ヘアケア"], status: "approved", joinedAt: "2026-01-15" },
  { id: "inf_003", name: "鈴木 れな", username: "rena_skincare", email: "rena@example.com", image: "https://ui-avatars.com/api/?name=れな&background=E8D6FF&color=333", platforms: { instagram: 50000, tiktok: 30000, youtube: 20000 }, categories: ["スキンケア", "ライフスタイル"], status: "approved", joinedAt: "2026-02-01" },
  { id: "inf_004", name: "木村 さくら", username: "sakura_nail", email: "sakura@example.com", image: "https://ui-avatars.com/api/?name=さくら&background=FFE8D6&color=333", platforms: { instagram: 8000, tiktok: 15000 }, categories: ["ネイル", "ファッション"], status: "reviewing", joinedAt: "2026-02-10" },
  { id: "inf_005", name: "渡辺 ゆい", username: "yui_fragrance", email: "yui@example.com", image: "https://ui-avatars.com/api/?name=ゆい&background=D6FFE8&color=333", platforms: { instagram: 32000, youtube: 18000 }, categories: ["フレグランス", "ライフスタイル"], status: "approved", joinedAt: "2026-02-05" },
];

// ========== Campaigns ==========
export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: "1", title: "新作スキンケアライン「ルミエール」のPR投稿",
    description: "新発売のスキンケアライン「ルミエール」を実際に使用していただき、使用感や効果をSNSでPRしていただける美容インフルエンサーを募集します。\n\n商品は事前にお届けし、2週間以上ご使用いただいた上でのレビューをお願いします。投稿内容は事前にご確認させていただきます。",
    company: { id: "c1", name: "ルミエール・コスメティック" }, category: "スキンケア",
    images: ["https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=600&fit=crop"],
    reward: 50000, maxApplicants: 10, currentApplicants: 6, deadline: "2026-03-31",
    requirements: ["Instagramフォロワー5,000人以上", "美容関連の投稿実績があること", "20〜40代の女性"],
    platforms: ["instagram"], deliverables: ["フィード投稿1本", "ストーリーズ3本"], status: "recruiting", createdAt: "2026-02-01",
  },
  {
    id: "2", title: "オーガニックヘアオイル体験レビュー",
    description: "100%オーガニック成分のヘアオイルをお試しいただき、リアルなレビューをお願いします。",
    company: { id: "c2", name: "ナチュラルビューティー株式会社" }, category: "ヘアケア",
    images: ["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop"],
    reward: 30000, maxApplicants: 15, currentApplicants: 12, deadline: "2026-03-15",
    requirements: ["フォロワー3,000人以上", "ヘアケアに興味のある方"],
    platforms: ["instagram", "tiktok"], deliverables: ["リール動画1本", "フィード投稿1本"], status: "recruiting", createdAt: "2026-01-25",
  },
  {
    id: "3", title: "春の新色リップコレクション撮影モデル",
    description: "2026年春の新色リップコレクションのSNS用ビジュアル撮影モデルを募集します。",
    company: { id: "c3", name: "Bloom Cosmetics" }, category: "メイク",
    images: ["https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&h=600&fit=crop"],
    reward: 80000, maxApplicants: 5, currentApplicants: 3, deadline: "2026-04-10",
    requirements: ["Instagramフォロワー10,000人以上", "メイク系コンテンツのクリエイター", "都内撮影に参加可能な方"],
    platforms: ["instagram", "youtube"], deliverables: ["撮影参加", "Instagram投稿2本"], status: "recruiting", createdAt: "2026-02-10",
  },
  {
    id: "4", title: "ボディスクラブ新商品モニター",
    description: "天然由来成分のボディスクラブをお試しいただき、使用レポートをお願いします。",
    company: { id: "c4", name: "ピュアスキン・ジャパン" }, category: "ボディケア",
    images: ["https://images.unsplash.com/photo-1570194065650-d99fb4b38b17?w=800&h=600&fit=crop"],
    reward: 25000, maxApplicants: 20, currentApplicants: 8, deadline: "2026-03-20",
    requirements: ["フォロワー1,000人以上", "ボディケア商品のレビュー経験"],
    platforms: ["instagram"], deliverables: ["フィード投稿1本", "ストーリーズ2本"], status: "recruiting", createdAt: "2026-02-05",
  },
  {
    id: "5", title: "ネイルサロン体験レポート（表参道店）",
    description: "表参道にオープンしたネイルサロンの体験レポートをお願いします。施術費用は全額負担します。",
    company: { id: "c5", name: "グランネイル" }, category: "ネイル",
    images: ["https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop"],
    reward: 35000, maxApplicants: 8, currentApplicants: 5, deadline: "2026-03-25",
    requirements: ["フォロワー5,000人以上", "ネイル関連の投稿経験", "表参道に来店可能な方"],
    platforms: ["instagram", "tiktok"], deliverables: ["リール動画1本", "ストーリーズ5本"], status: "recruiting", createdAt: "2026-02-08",
  },
  {
    id: "6", title: "高級フレグランスブランドのアンバサダー",
    description: "フランス発の高級フレグランスブランドの日本上陸に伴い、SNSアンバサダーを募集します。",
    company: { id: "c6", name: "Maison de Parfum" }, category: "フレグランス",
    images: ["https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&h=600&fit=crop"],
    reward: 120000, maxApplicants: 3, currentApplicants: 2, deadline: "2026-04-30",
    requirements: ["フォロワー20,000人以上", "ライフスタイル系インフルエンサー", "長期契約（3ヶ月）可能な方"],
    platforms: ["instagram", "youtube"], deliverables: ["月2本のフィード投稿", "月4本のストーリーズ"], status: "recruiting", createdAt: "2026-02-15",
  },
];

// ========== Applications ==========
export const MOCK_APPLICATIONS: Application[] = [
  { id: "app_001", campaignId: "1", influencerId: "inf_001", companyId: "c1", status: "approved", motivation: "スキンケアが大好きで、ルミエールの製品にとても興味があります。フォロワーにも美容意識の高い方が多いので、良いPRができると思います。", appliedAt: "2026-02-05", reviewedAt: "2026-02-08", reviewComment: "フォロワー層がマッチしています" },
  { id: "app_002", campaignId: "1", influencerId: "inf_003", companyId: "c1", status: "reviewing", motivation: "スキンケア専門のコンテンツを作成しており、成分分析なども得意です。", appliedAt: "2026-02-10" },
  { id: "app_003", campaignId: "2", influencerId: "inf_002", companyId: "c2", status: "approved", motivation: "ヘアケア商品のレビューを多数行ってきました。オーガニック製品は特に人気が出ると思います。", appliedAt: "2026-02-03", reviewedAt: "2026-02-06", reviewComment: "過去のレビュー実績が優秀" },
  { id: "app_004", campaignId: "2", influencerId: "inf_001", companyId: "c2", status: "applied", motivation: "ヘアケアにも関心があり、ぜひ体験してみたいです。", appliedAt: "2026-02-12" },
  { id: "app_005", campaignId: "3", influencerId: "inf_003", companyId: "c3", status: "approved", motivation: "メイク動画の制作が得意で、撮影経験も豊富です。", appliedAt: "2026-02-11", reviewedAt: "2026-02-13", reviewComment: "ポートフォリオが素晴らしい" },
  { id: "app_006", campaignId: "3", influencerId: "inf_002", companyId: "c3", status: "rejected", motivation: "リップ系のコンテンツをよく投稿しています。", appliedAt: "2026-02-12", reviewedAt: "2026-02-14", reviewComment: "今回はフォロワー層が異なるため" },
  { id: "app_007", campaignId: "4", influencerId: "inf_001", companyId: "c4", status: "completed", motivation: "ボディケア商品のレビューを普段から行っています。", appliedAt: "2026-01-20", reviewedAt: "2026-01-25", reviewComment: "レビュー完了、品質高い" },
  { id: "app_008", campaignId: "5", influencerId: "inf_004", companyId: "c5", status: "applied", motivation: "ネイルが趣味で、サロンレポートは得意分野です。表参道にもすぐ行けます。", appliedAt: "2026-02-15" },
  { id: "app_009", campaignId: "6", influencerId: "inf_005", companyId: "c6", status: "reviewing", motivation: "フレグランスのコンテンツを専門的に発信しています。長期契約も大歓迎です。", appliedAt: "2026-02-16" },
  { id: "app_010", campaignId: "6", influencerId: "inf_003", companyId: "c6", status: "applied", motivation: "ライフスタイル系の発信をしており、高級ブランドとの相性が良いと思います。", appliedAt: "2026-02-17" },
];

// ========== Messages ==========
export const MOCK_MESSAGES: Message[] = [
  { id: "msg_001", senderId: "c1", senderType: "company", receiverId: "inf_001", receiverType: "influencer", subject: "「ルミエール」PR案件の採用通知", content: "田中 美咲 様\n\nこの度は「ルミエール」PR案件にご応募いただき、誠にありがとうございます。\n選考の結果、採用とさせていただくことになりました。\n\n商品は来週中にお届けいたします。詳細なスケジュールについて改めてご連絡いたします。\n\nよろしくお願いいたします。\nルミエール・コスメティック 山田", read: true, createdAt: "2026-02-08T10:00:00" },
  { id: "msg_002", senderId: "inf_001", senderType: "influencer", receiverId: "c1", receiverType: "company", subject: "Re: 「ルミエール」PR案件の採用通知", content: "山田様\n\nご連絡ありがとうございます。採用いただき大変嬉しく思います！\n商品の到着を楽しみにお待ちしております。\n\nよろしくお願いいたします。\n田中 美咲", read: true, createdAt: "2026-02-08T14:30:00" },
  { id: "msg_003", senderId: "c2", senderType: "company", receiverId: "inf_002", receiverType: "influencer", subject: "ヘアオイルレビュー案件の採用について", content: "佐藤 あいり 様\n\nヘアオイル体験レビュー案件への応募ありがとうございます。\n採用が決定いたしました。商品を本日発送いたします。\n\nナチュラルビューティー株式会社 鈴木", read: false, createdAt: "2026-02-06T09:00:00" },
  { id: "msg_004", senderId: "c3", senderType: "company", receiverId: "inf_003", receiverType: "influencer", subject: "リップコレクション撮影のご案内", content: "鈴木 れな 様\n\n撮影の日程が決まりましたのでご連絡いたします。\n日時：3月15日(日) 10:00〜16:00\n場所：目黒スタジオ\n\nBloom Cosmetics 佐藤", read: false, createdAt: "2026-02-14T11:00:00" },
  { id: "msg_005", senderId: "c6", senderType: "company", receiverId: "inf_005", receiverType: "influencer", subject: "【スカウト】フレグランスアンバサダーのお誘い", content: "渡辺 ゆい 様\n\n初めまして。Maison de Parfumの日本支社長のジャン・ピエールと申します。\nゆい様のInstagramを拝見し、ブランドイメージに非常にマッチすると感じております。\n\nぜひアンバサダーとしてご活躍いただけないかとお声がけさせていただきました。\nご興味がございましたら、ぜひご応募ください。\n\nよろしくお願いいたします。", read: false, createdAt: "2026-02-16T15:00:00" },
  { id: "msg_006", senderId: "admin", senderType: "admin", receiverId: "c5", receiverType: "company", subject: "企業アカウント審査について", content: "グランネイル 中村様\n\n企業アカウントの審査が完了しました。\n現在「承認待ち」ステータスとなっております。\n追加書類のご提出をお願いいたします。\n\nPRizm事務局", read: true, createdAt: "2026-02-12T16:00:00" },
];

export const MOCK_USER = {
  id: "inf_001",
  lastName: "田中",
  firstName: "美咲",
  name: "田中 美咲",
  email: "misaki@example.com",
  profileImagePreview: "https://ui-avatars.com/api/?name=美咲&background=FFD6E8&color=333",
  type: "influencer",
  instagram: "@misaki_beauty",
  followers: 15000,
};

// ========== Helper functions ==========
export function getApplicationsForCampaign(campaignId: string) {
  return MOCK_APPLICATIONS.filter(a => a.campaignId === campaignId);
}

export function getApplicationsForInfluencer(influencerId: string) {
  return MOCK_APPLICATIONS.filter(a => a.influencerId === influencerId);
}

export function getApplicationsForCompany(companyId: string) {
  return MOCK_APPLICATIONS.filter(a => a.companyId === companyId);
}

export function getMessagesForUser(userId: string) {
  return MOCK_MESSAGES.filter(m => m.receiverId === userId || m.senderId === userId);
}

export function getCampaignsForCompany(companyId: string) {
  return MOCK_CAMPAIGNS.filter(c => c.company.id === companyId);
}

export function getInfluencerById(id: string) {
  return MOCK_INFLUENCERS.find(i => i.id === id);
}

export function getCompanyById(id: string) {
  return MOCK_COMPANIES.find(c => c.id === id);
}

export function getCampaignById(id: string) {
  return MOCK_CAMPAIGNS.find(c => c.id === id);
}
