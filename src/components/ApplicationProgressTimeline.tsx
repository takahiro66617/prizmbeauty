import { CheckCircle, Circle, Clock, User, CalendarDays, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { APPLICATION_STATUSES } from "@/lib/constants";

const PHASE_FLOW = [
  { id: "applied", label: "応募", icon: "📩", desc: "応募が送信されました" },
  { id: "reviewing", label: "選考中", icon: "🔍", desc: "事務局が選考中です" },
  { id: "approved", label: "採用", icon: "✅", desc: "採用が決定しました" },
  { id: "in_progress", label: "案件進行中", icon: "🚀", desc: "案件が進行しています" },
  { id: "post_submitted", label: "投稿済み", icon: "📤", desc: "投稿が提出されました" },
  { id: "post_confirmed", label: "投稿確認済", icon: "👁️", desc: "投稿が承認されました" },
  { id: "payment_pending", label: "振込待ち", icon: "💰", desc: "振込を待っています" },
  { id: "completed", label: "完了", icon: "🎉", desc: "案件が完了しました" },
];

const SPECIAL_STATUSES = ["rejected", "revision_requested", "cancelled"];

interface Props {
  status: string;
  appliedAt: string;
  updatedAt: string;
  influencer?: { name: string; username: string; image_url?: string | null } | null;
  campaign?: { title: string; deadline?: string | null; payment_date?: string | null; companies?: { name: string } | null } | null;
  compact?: boolean;
}

export function ApplicationProgressTimeline({ status, appliedAt, updatedAt, influencer, campaign, compact }: Props) {
  const isSpecial = SPECIAL_STATUSES.includes(status);
  const currentIdx = PHASE_FLOW.findIndex(p => p.id === status);
  const activeIdx = isSpecial ? -1 : currentIdx;

  const now = new Date();
  const deadlineDays = campaign?.deadline ? Math.ceil((new Date(campaign.deadline).getTime() - now.getTime()) / 86400000) : null;
  const paymentDays = campaign?.payment_date ? Math.ceil((new Date(campaign.payment_date).getTime() - now.getTime()) / 86400000) : null;

  const appSt = APPLICATION_STATUSES.find(s => s.id === status);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-bold text-gray-800 text-base">📊 案件進行ステータス</h3>
        <Badge className={`text-sm px-3 py-1 ${appSt?.color || ""}`}>{appSt?.label || status}</Badge>
      </div>

      {/* Assignee + Campaign Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {influencer && (
          <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
            <img
              src={influencer.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(influencer.name)}&background=c084fc&color=fff`}
              alt="" className="w-12 h-12 rounded-full shadow-sm border-2 border-white"
            />
            <div className="min-w-0">
              <p className="text-xs text-purple-500 font-medium flex items-center gap-1"><User className="w-3 h-3" />アサインIF</p>
              <p className="font-bold text-gray-900 truncate">{influencer.name}</p>
              <p className="text-xs text-gray-500">@{influencer.username}</p>
            </div>
          </div>
        )}
        {campaign && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs text-blue-500 font-medium mb-1">📋 案件</p>
            <p className="font-bold text-gray-900 truncate text-sm">{campaign.title}</p>
            {campaign.companies?.name && <p className="text-xs text-gray-500">{campaign.companies.name}</p>}
          </div>
        )}
      </div>

      {/* Phase Deadlines */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-400 mb-0.5">応募日</p>
          <p className="font-bold text-sm text-gray-800">{new Date(appliedAt).toLocaleDateString("ja-JP")}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-400 mb-0.5">最終更新</p>
          <p className="font-bold text-sm text-gray-800">{new Date(updatedAt).toLocaleDateString("ja-JP")}</p>
        </div>
        {campaign?.deadline && (
          <div className={`rounded-xl p-3 text-center ${deadlineDays !== null && deadlineDays <= 3 ? "bg-red-50 border border-red-200" : "bg-gray-50"}`}>
            <p className="text-xs text-gray-400 mb-0.5 flex items-center justify-center gap-1">
              <CalendarDays className="w-3 h-3" />募集締切
            </p>
            <p className={`font-bold text-sm ${deadlineDays !== null && deadlineDays <= 3 ? "text-red-600" : "text-gray-800"}`}>
              {new Date(campaign.deadline).toLocaleDateString("ja-JP")}
            </p>
            {deadlineDays !== null && (
              <p className={`text-xs mt-0.5 ${deadlineDays <= 0 ? "text-red-500 font-bold" : deadlineDays <= 7 ? "text-amber-600" : "text-gray-400"}`}>
                {deadlineDays <= 0 ? "⚠️ 期限切れ" : `あと${deadlineDays}日`}
              </p>
            )}
          </div>
        )}
        {campaign?.payment_date && (
          <div className={`rounded-xl p-3 text-center ${paymentDays !== null && paymentDays <= 3 ? "bg-orange-50 border border-orange-200" : "bg-gray-50"}`}>
            <p className="text-xs text-gray-400 mb-0.5 flex items-center justify-center gap-1">
              <CalendarDays className="w-3 h-3" />振込期日
            </p>
            <p className={`font-bold text-sm ${paymentDays !== null && paymentDays <= 3 ? "text-orange-600" : "text-gray-800"}`}>
              {new Date(campaign.payment_date).toLocaleDateString("ja-JP")}
            </p>
            {paymentDays !== null && (
              <p className={`text-xs mt-0.5 ${paymentDays <= 0 ? "text-red-500 font-bold" : paymentDays <= 7 ? "text-amber-600" : "text-gray-400"}`}>
                {paymentDays <= 0 ? "⚠️ 期限切れ" : `あと${paymentDays}日`}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Special status alert */}
      {isSpecial && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          status === "rejected" ? "bg-red-50 border-red-200" :
          status === "revision_requested" ? "bg-amber-50 border-amber-200" :
          "bg-gray-100 border-gray-200"
        }`}>
          <AlertTriangle className={`w-5 h-5 shrink-0 ${
            status === "rejected" ? "text-red-500" :
            status === "revision_requested" ? "text-amber-500" : "text-gray-500"
          }`} />
          <div>
            <p className="font-bold text-sm">
              {status === "rejected" && "不採用"}
              {status === "revision_requested" && "修正依頼中"}
              {status === "cancelled" && "キャンセル済み"}
            </p>
            <p className="text-xs text-gray-500">
              {status === "rejected" && "この応募は不採用となりました。"}
              {status === "revision_requested" && "投稿内容の修正が求められています。修正完了後に再提出してください。"}
              {status === "cancelled" && "この案件はキャンセルされました。"}
            </p>
          </div>
        </div>
      )}

      {/* Visual Timeline */}
      <div className="relative">
        {compact ? (
          /* Compact horizontal */
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {PHASE_FLOW.map((phase, i) => {
              const isDone = activeIdx >= 0 && i < activeIdx;
              const isCurrent = i === activeIdx;
              return (
                <div key={phase.id} className="flex items-center">
                  <div className={`flex flex-col items-center min-w-[60px] ${isCurrent ? "scale-110" : ""}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all ${
                      isDone ? "bg-green-500 border-green-500 text-white" :
                      isCurrent ? "bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-200" :
                      "bg-gray-100 border-gray-200 text-gray-400"
                    }`}>
                      {isDone ? <CheckCircle className="w-4 h-4" /> : phase.icon}
                    </div>
                    <span className={`text-[10px] mt-1 text-center leading-tight ${isCurrent ? "font-bold text-purple-700" : isDone ? "text-green-700" : "text-gray-400"}`}>
                      {phase.label}
                    </span>
                  </div>
                  {i < PHASE_FLOW.length - 1 && (
                    <div className={`w-4 h-0.5 mt-[-12px] ${isDone ? "bg-green-400" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Full vertical timeline */
          <div className="space-y-0">
            {PHASE_FLOW.map((phase, i) => {
              const isDone = activeIdx >= 0 && i < activeIdx;
              const isCurrent = i === activeIdx;
              const isLast = i === PHASE_FLOW.length - 1;
              return (
                <div key={phase.id} className="flex gap-4">
                  {/* Line + dot */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base border-2 shrink-0 transition-all ${
                      isDone ? "bg-green-500 border-green-500 text-white" :
                      isCurrent ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-200 ring-4 ring-purple-100" :
                      "bg-gray-100 border-gray-200 text-gray-400"
                    }`}>
                      {isDone ? <CheckCircle className="w-5 h-5" /> : <span>{phase.icon}</span>}
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 h-8 ${isDone ? "bg-green-400" : "bg-gray-200"}`} />
                    )}
                  </div>
                  {/* Content */}
                  <div className={`pb-6 pt-1.5 ${isCurrent ? "" : ""}`}>
                    <p className={`font-bold text-sm ${isCurrent ? "text-purple-700" : isDone ? "text-green-700" : "text-gray-400"}`}>
                      {phase.label}
                    </p>
                    <p className={`text-xs ${isCurrent ? "text-gray-600" : isDone ? "text-gray-500" : "text-gray-300"}`}>
                      {phase.desc}
                    </p>
                    {isCurrent && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-purple-400" />
                        <span className="text-xs text-purple-500 font-medium">現在のフェーズ</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>進捗</span>
          <span>{activeIdx >= 0 ? Math.round(((activeIdx + 1) / PHASE_FLOW.length) * 100) : 0}%</span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${activeIdx >= 0 ? ((activeIdx + 1) / PHASE_FLOW.length) * 100 : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}
