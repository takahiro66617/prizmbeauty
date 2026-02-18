import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TrendingUp, FileText, Users, Bell, PlusCircle, MessageCircle } from "lucide-react";
import { getCampaignsForCompany, getApplicationsForCompany, getMessagesForUser, MOCK_COMPANIES } from "@/lib/mockData";

export default function ClientDashboard() {
  const companyId = sessionStorage.getItem("client_company_id") || "c1";
  const company = MOCK_COMPANIES.find(c => c.id === companyId);
  const campaigns = getCampaignsForCompany(companyId);
  const applications = getApplicationsForCompany(companyId);
  const messages = getMessagesForUser(companyId);

  const activeCampaigns = campaigns.filter(c => c.status === "recruiting").length;
  const pendingApps = applications.filter(a => ["applied", "reviewing"].includes(a.status)).length;
  const approvedApps = applications.filter(a => a.status === "approved").length;
  const unreadMessages = messages.filter(m => !m.read && m.receiverId === companyId).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
        <p className="text-gray-500 mt-1">{company?.name} の管理画面です。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border-0 shadow-lg bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">稼働中案件</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{activeCampaigns}<span className="text-sm font-normal text-gray-400 ml-1">件</span></h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full text-blue-500"><FileText className="w-6 h-6" /></div>
          </div>
        </Card>
        <Card className="p-6 border-0 shadow-lg bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">選考中の応募</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{pendingApps}<span className="text-sm font-normal text-gray-400 ml-1">件</span></h3>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full text-yellow-500"><TrendingUp className="w-6 h-6" /></div>
          </div>
        </Card>
        <Card className="p-6 border-0 shadow-lg bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">採用済み</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{approvedApps}<span className="text-sm font-normal text-gray-400 ml-1">名</span></h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full text-green-500"><Users className="w-6 h-6" /></div>
          </div>
        </Card>
        <Card className="p-6 border-0 shadow-lg bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">未読メッセージ</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{unreadMessages}<span className="text-sm font-normal text-gray-400 ml-1">件</span></h3>
            </div>
            <div className="p-3 bg-pink-100 rounded-full text-pink-500"><MessageCircle className="w-6 h-6" /></div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6 border-0 shadow-lg bg-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center"><Bell className="w-5 h-5 mr-2 text-yellow-500" />ToDo / お知らせ</h2>
          </div>
          <div className="space-y-4">
            {applications.filter(a => a.status === "applied").map(app => (
              <div key={app.id} className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                <div className="w-2 h-2 mt-2 rounded-full bg-red-500 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">新しい応募が届いています（案件ID: {app.campaignId}）</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(app.appliedAt).toLocaleDateString("ja-JP")} - 選考をお願いします</p>
                </div>
                <Link to="/client/applicants"><Button className="h-8 text-xs bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-none">確認</Button></Link>
              </div>
            ))}
            {applications.filter(a => a.status === "applied").length === 0 && (
              <p className="text-center text-gray-400 py-4">現在対応が必要なタスクはありません</p>
            )}
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-lg bg-white">
          <h2 className="text-lg font-bold text-gray-800 mb-6">クイックアクション</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/client/campaigns/new" className="block">
              <div className="p-4 border border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center text-center h-32 group">
                <div className="p-3 bg-blue-100 rounded-full text-blue-600 mb-2 group-hover:bg-blue-200"><PlusCircle className="w-6 h-6" /></div>
                <span className="text-sm font-bold text-gray-700 group-hover:text-blue-700">新規案件作成</span>
              </div>
            </Link>
            <Link to="/client/applicants" className="block">
              <div className="p-4 border border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all flex flex-col items-center justify-center text-center h-32 group">
                <div className="p-3 bg-green-100 rounded-full text-green-600 mb-2 group-hover:bg-green-200"><Users className="w-6 h-6" /></div>
                <span className="text-sm font-bold text-gray-700 group-hover:text-green-700">応募者確認</span>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
