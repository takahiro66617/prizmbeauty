import { useState } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { Search as SearchIcon, Briefcase } from "lucide-react";
import MyPageCampaigns from "./MyPageCampaigns";
import MyPageMessages from "./MyPageMessages";

const tabs = [
  { id: "browse", label: "案件を探す", icon: SearchIcon },
  { id: "progress", label: "案件進行管理", icon: Briefcase },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function MyPageCampaignHub() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMessagesRoute = location.pathname === "/mypage/messages";
  const paramTab = searchParams.get("tab") as TabId | null;
  const initialTab: TabId = paramTab || (isMessagesRoute ? "progress" : "browse");
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setSearchParams(tab === "browse" ? {} : { tab });
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">案件管理</h1>
        <p className="text-gray-500 mt-1">案件の検索・応募と進行中の案件を管理します。</p>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-pink-500 text-pink-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "browse" && <MyPageCampaigns embedded />}
      {activeTab === "progress" && <MyPageMessages embedded />}
    </div>
  );
}
