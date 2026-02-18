import { Button } from "@/components/ui/button";
import { Users, Download } from "lucide-react";

// Mock influencer data
const influencers = [
  {
    id: "inf_001",
    name: "田中 美咲",
    username: "misaki_beauty",
    image: "https://ui-avatars.com/api/?name=美咲&background=FFD6E8&color=333",
    platforms: { instagram: 15000, tiktok: 8000 },
    joinedAt: "2026-01-10",
  },
  {
    id: "inf_002",
    name: "佐藤 あいり",
    username: "airi_cosme",
    image: "https://ui-avatars.com/api/?name=あいり&background=D6E8FF&color=333",
    platforms: { instagram: 25000, youtube: 12000 },
    joinedAt: "2026-01-15",
  },
  {
    id: "inf_003",
    name: "鈴木 れな",
    username: "rena_skincare",
    image: "https://ui-avatars.com/api/?name=れな&background=E8D6FF&color=333",
    platforms: { instagram: 50000, tiktok: 30000, youtube: 20000 },
    joinedAt: "2026-02-01",
  },
];

export default function AdminInfluencersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">インフルエンサー管理</h1>
          <p className="text-gray-500 mt-1">登録インフルエンサーの検索・確認を行います。</p>
        </div>
        <Button variant="outline" className="shadow-sm">
          <Download className="w-4 h-4 mr-2" /> CSV出力
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">ユーザー</th>
              <th className="px-6 py-4">SNSフォロワー数</th>
              <th className="px-6 py-4">登録日</th>
              <th className="px-6 py-4">ステータス</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {influencers.map((inf) => (
              <tr key={inf.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={inf.image}
                      alt=""
                      className="w-8 h-8 rounded-full bg-gray-200 object-cover"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{inf.name}</div>
                      <div className="text-gray-500 text-xs">@{inf.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {inf.platforms.instagram && (
                      <span className="text-xs text-pink-600">
                        IG: {inf.platforms.instagram.toLocaleString()}
                      </span>
                    )}
                    {inf.platforms.tiktok && (
                      <span className="text-xs text-black">
                        TT: {inf.platforms.tiktok.toLocaleString()}
                      </span>
                    )}
                    {inf.platforms.youtube && (
                      <span className="text-xs text-red-600">
                        YT: {inf.platforms.youtube.toLocaleString()}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(inf.joinedAt).toLocaleDateString("ja-JP")}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      有効
                    </span>
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                      編集
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
