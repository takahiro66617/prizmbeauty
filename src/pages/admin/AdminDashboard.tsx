import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  TrendingUp,
  Users,
  FileText,
  FileEdit,
  Building2,
} from "lucide-react";
import { MOCK_CAMPAIGNS } from "@/lib/mockData";

export default function AdminDashboard() {
  const activeCampaigns = MOCK_CAMPAIGNS.filter(
    (c) => c.status === "recruiting"
  ).length;
  const totalApplicants = MOCK_CAMPAIGNS.reduce(
    (sum, c) => sum + (c.currentApplicants || 0),
    0
  );
  const companyCount = new Set(MOCK_CAMPAIGNS.map((c) => c.company.id)).size;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
        <p className="text-gray-500 mt-1">
          事務局管理画面へようこそ。本日の状況を確認しましょう。
        </p>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-0 shadow-lg bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">今月の総応募数</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">
                {totalApplicants}{" "}
                <span className="text-sm font-normal text-gray-400">件</span>
              </h3>
            </div>
            <div className="p-3 bg-pink-100 rounded-full text-pink-500">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Link to="/admin/campaigns" className="block hover:opacity-95 transition-opacity">
          <Card className="p-6 border-0 shadow-lg bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">稼働中案件数</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-2">
                  {activeCampaigns}{" "}
                  <span className="text-sm font-normal text-gray-400">件</span>
                </h3>
              </div>
              <div className="p-3 bg-purple-100 rounded-full text-purple-500">
                <FileText className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full w-2/3"></div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/clients" className="block hover:opacity-95 transition-opacity">
          <Card className="p-6 border-0 shadow-lg bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">登録企業数</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-2">
                  {companyCount}{" "}
                  <span className="text-sm font-normal text-gray-400">社</span>
                </h3>
              </div>
              <div className="p-3 bg-blue-100 rounded-full text-blue-500">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ToDo List */}
        <Card className="p-6 border-0 shadow-lg bg-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-yellow-500" />
              ToDo / お知らせ
            </h2>
            <Button variant="outline" className="text-xs h-8">
              すべて見る
            </Button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
              >
                <div className="w-2 h-2 mt-2 rounded-full bg-red-500 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    株式会社BeautyPlusの案件に応募が5件来ています
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    2025/12/19 10:00 - 選定期限まであと2日
                  </p>
                </div>
                <Button className="h-8 text-xs bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-none">
                  確認
                </Button>
              </div>
            ))}
            <div className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  新規企業「OrganicCostume」の登録依頼
                </p>
                <p className="text-xs text-gray-500 mt-1">2025/12/18 15:30</p>
              </div>
              <Button className="h-8 text-xs bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-none">
                詳細
              </Button>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6 border-0 shadow-lg bg-white">
          <h2 className="text-lg font-bold text-gray-800 mb-6">
            クイックアクション
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/admin/campaigns" className="block">
              <div className="p-4 border border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all flex flex-col items-center justify-center text-center h-32 group">
                <div className="p-3 bg-purple-100 rounded-full text-purple-600 mb-2 group-hover:bg-purple-200 transition-colors">
                  <FileEdit className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-gray-700 group-hover:text-purple-700">
                  新規案件登録
                </span>
              </div>
            </Link>
            <Link to="/admin/clients" className="block">
              <div className="p-4 border border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center text-center h-32 group">
                <div className="p-3 bg-blue-100 rounded-full text-blue-600 mb-2 group-hover:bg-blue-200 transition-colors">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-gray-700 group-hover:text-blue-700">
                  企業登録
                </span>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
