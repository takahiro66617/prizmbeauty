// PRizm Beauty Mock Data

export interface Company {
  id: string;
  name: string;
  logo?: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  company: Company;
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

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: "1",
    title: "新作スキンケアライン「ルミエール」のPR投稿",
    description: "新発売のスキンケアライン「ルミエール」を実際に使用していただき、使用感や効果をSNSでPRしていただける美容インフルエンサーを募集します。\n\n商品は事前にお届けし、2週間以上ご使用いただいた上でのレビューをお願いします。投稿内容は事前にご確認させていただきます。",
    company: { id: "c1", name: "ルミエール・コスメティック" },
    category: "スキンケア",
    images: ["https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=600&fit=crop"],
    reward: 50000,
    maxApplicants: 10,
    currentApplicants: 6,
    deadline: "2026-03-31",
    requirements: ["Instagramフォロワー5,000人以上", "美容関連の投稿実績があること", "20〜40代の女性"],
    platforms: ["instagram"],
    deliverables: ["フィード投稿1本", "ストーリーズ3本"],
    status: "recruiting",
    createdAt: "2026-02-01",
  },
  {
    id: "2",
    title: "オーガニックヘアオイル体験レビュー",
    description: "100%オーガニック成分のヘアオイルをお試しいただき、リアルなレビューをお願いします。",
    company: { id: "c2", name: "ナチュラルビューティー株式会社" },
    category: "ヘアケア",
    images: ["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop"],
    reward: 30000,
    maxApplicants: 15,
    currentApplicants: 12,
    deadline: "2026-03-15",
    requirements: ["フォロワー3,000人以上", "ヘアケアに興味のある方"],
    platforms: ["instagram", "tiktok"],
    deliverables: ["リール動画1本", "フィード投稿1本"],
    status: "recruiting",
    createdAt: "2026-01-25",
  },
  {
    id: "3",
    title: "春の新色リップコレクション撮影モデル",
    description: "2026年春の新色リップコレクションのSNS用ビジュアル撮影モデルを募集します。",
    company: { id: "c3", name: "Bloom Cosmetics" },
    category: "メイク",
    images: ["https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&h=600&fit=crop"],
    reward: 80000,
    maxApplicants: 5,
    currentApplicants: 3,
    deadline: "2026-04-10",
    requirements: ["Instagramフォロワー10,000人以上", "メイク系コンテンツのクリエイター", "都内撮影に参加可能な方"],
    platforms: ["instagram", "youtube"],
    deliverables: ["撮影参加", "Instagram投稿2本"],
    status: "recruiting",
    createdAt: "2026-02-10",
  },
  {
    id: "4",
    title: "ボディスクラブ新商品モニター",
    description: "天然由来成分のボディスクラブをお試しいただき、使用レポートをお願いします。",
    company: { id: "c4", name: "ピュアスキン・ジャパン" },
    category: "ボディケア",
    images: ["https://images.unsplash.com/photo-1570194065650-d99fb4b38b17?w=800&h=600&fit=crop"],
    reward: 25000,
    maxApplicants: 20,
    currentApplicants: 8,
    deadline: "2026-03-20",
    requirements: ["フォロワー1,000人以上", "ボディケア商品のレビュー経験"],
    platforms: ["instagram"],
    deliverables: ["フィード投稿1本", "ストーリーズ2本"],
    status: "recruiting",
    createdAt: "2026-02-05",
  },
  {
    id: "5",
    title: "ネイルサロン体験レポート（表参道店）",
    description: "表参道にオープンしたネイルサロンの体験レポートをお願いします。施術費用は全額負担します。",
    company: { id: "c5", name: "グランネイル" },
    category: "ネイル",
    images: ["https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop"],
    reward: 35000,
    maxApplicants: 8,
    currentApplicants: 5,
    deadline: "2026-03-25",
    requirements: ["フォロワー5,000人以上", "ネイル関連の投稿経験", "表参道に来店可能な方"],
    platforms: ["instagram", "tiktok"],
    deliverables: ["リール動画1本", "ストーリーズ5本"],
    status: "recruiting",
    createdAt: "2026-02-08",
  },
  {
    id: "6",
    title: "高級フレグランスブランドのアンバサダー",
    description: "フランス発の高級フレグランスブランドの日本上陸に伴い、SNSアンバサダーを募集します。",
    company: { id: "c6", name: "Maison de Parfum" },
    category: "フレグランス",
    images: ["https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&h=600&fit=crop"],
    reward: 120000,
    maxApplicants: 3,
    currentApplicants: 2,
    deadline: "2026-04-30",
    requirements: ["フォロワー20,000人以上", "ライフスタイル系インフルエンサー", "長期契約（3ヶ月）可能な方"],
    platforms: ["instagram", "youtube"],
    deliverables: ["月2本のフィード投稿", "月4本のストーリーズ"],
    status: "recruiting",
    createdAt: "2026-02-15",
  },
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
