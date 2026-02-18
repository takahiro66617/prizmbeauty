import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ArrowRight, Bell, TrendingUp, Users, FileText, FileEdit, Building2, UserCheck,
} from "lucide-react";
import { useExternalCampaigns } from "@/hooks/useExternalCampaigns";
import { useExternalCompanies } from "@/hooks/useExternalCompanies";
import { useExternalInfluencers } from "@/hooks/useExternalInfluencers";
import { useExternalApplications } from "@/hooks/useExternalApplications";

export default function AdminDashboard() {
  const { data: campaigns = [] } = useExternalCampaigns();
  const { data: companies = [] } = useExternalCompanies();
  const { data: influencers = [] } = useExternalInfluencers();
  const { data: applications = [] } = useExternalApplications();

  const activeCampaigns = campaigns.filter(c => c.status === "recruiting").length;
  const totalApplicants = applications.length;
  const companyCount = companies.length;
  const influencerCount = influencers.length;
  const approvedApps = applications.filter(a => a.status === "approved").length;
  const pendingApps = applications.filter(a => ["applied", "reviewing"].includes(a.status)).length;
  const pendingInfluencers = influencers.filter(i => i.status === "pending").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
        <p className="text-gray-500 mt-1">事務局管理画面へようこそ。全体の状況を確認しましょう。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-0 shadow-lg bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">総応募数</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{totalApplicants}<span className="text-sm font-normal text-gray-400 ml-1">件</span></h3>
              <p className="text-xs text-green-600 mt-1">選考中: {pendingApps}件</p>
            </div>
            <div className="p-3 bg-pink-100 rounded-full text-pink-500"><TrendingUp className="w-6 h-6" /></div>
          </div>
        </Card>

        <Link to="/admin/campaigns" className="block hover:opacity-95 transition-opacity">
          <Card className="p-6 border-0 shadow-lg bg-white h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">稼働中案件数</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-2">{activeCampaigns}<span className="text-sm font-normal text-gray-400 ml-1">件</span></h3>
              </div>
              <div className="p-3 bg-purple-100 rounded-full text-purple-500"><FileText className="w-6 h-6" /></div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/clients" className="block hover:opacity-95 transition-opacity">
          <Card className="p-6 border-0 shadow-lg bg-white h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">登録企業数</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-2">{companyCount}<span className="text-sm font-normal text-gray-400 ml-1">社</span></h3>
              </div>
              <div className="p-3 bg-blue-100 rounded-full text-blue-500"><Building2 className="w-6 h-6" /></div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/influencers" className="block hover:opacity-95 transition-opacity">
          <Card className="p-6 border-0 shadow-lg bg-white h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">登録IF数</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-2">{influencerCount}<span className="text-sm font-normal text-gray-400 ml-1">名</span></h3>
                {pendingInfluencers > 0 && <p className="text-xs text-yellow-600 mt-1">審査待ち: {pendingInfluencers}名</p>}
              </div>
              <div className="p-3 bg-green-100 rounded-full text-green-500"><Users className="w-6 h-6" /></div>
            </div>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-0 shadow-sm bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg text-green-600"><UserCheck className="w-5 h-5" /></div>
            <div><p className="text-sm text-gray-500">月間マッチング数</p><p className="text-xl font-bold text-gray-800">{approvedApps}</p></div>
          </div>
        </Card>
        <Card className="p-4 border-0 shadow-sm bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600"><TrendingUp className="w-5 h-5" /></div>
            <div><p className="text-sm text-gray-500">選考中案件</p><p className="text-xl font-bold text-gray-800">{pendingApps}</p></div>
          </div>
        </Card>
        <Card className="p-4 border-0 shadow-sm bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><FileText className="w-5 h-5" /></div>
            <div><p className="text-sm text-gray-500">完了案件</p><p className="text-xl font-bold text-gray-800">{applications.filter(a => a.status === "completed").length}</p></div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6 border-0 shadow-lg bg-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center"><Bell className="w-5 h-5 mr-2 text-yellow-500" />ToDo / お知らせ</h2>
          </div>
          <div className="space-y-4">
            {influencers.filter(i => i.status === "pending").slice(0, 3).map(inf => (
              <Link key={inf.id} to="/admin/influencers" className="block">
                <div className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                  <div className="w-2 h-2 mt-2 rounded-full bg-yellow-500 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">インフルエンサー「{inf.name}」の審査待ち</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(inf.created_at).toLocaleDateString("ja-JP")}</p>
                  </div>
                </div>
              </Link>
            ))}
            {applications.filter(a => a.status === "applied").slice(0, 3).map(app => (
              <Link key={app.id} to="/admin/applications" className="block">
                <div className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                  <div className="w-2 h-2 mt-2 rounded-full bg-red-500 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {app.campaigns?.title || "案件"}に新しい応募（{app.influencer_profiles?.name || "IF"})
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(app.applied_at).toLocaleDateString("ja-JP")}</p>
                  </div>
                </div>
              </Link>
            ))}
            {influencers.filter(i => i.status === "pending").length === 0 && applications.filter(a => a.status === "applied").length === 0 && (
              <p className="text-center text-gray-400 py-4">現在対応が必要なタスクはありません</p>
            )}
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-lg bg-white">
          <h2 className="text-lg font-bold text-gray-800 mb-6">クイックアクション</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/admin/campaigns" className="block">
              <div className="p-4 border border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all flex flex-col items-center justify-center text-center h-32 group">
                <div className="p-3 bg-purple-100 rounded-full text-purple-600 mb-2 group-hover:bg-purple-200"><FileEdit className="w-6 h-6" /></div>
                <span className="text-sm font-bold text-gray-700 group-hover:text-purple-700">案件管理</span>
              </div>
            </Link>
            <Link to="/admin/clients" className="block">
              <div className="p-4 border border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center text-center h-32 group">
                <div className="p-3 bg-blue-100 rounded-full text-blue-600 mb-2 group-hover:bg-blue-200"><Building2 className="w-6 h-6" /></div>
                <span className="text-sm font-bold text-gray-700 group-hover:text-blue-700">企業管理</span>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
