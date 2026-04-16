import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Wifi, Send, Bell, ClipboardList } from "lucide-react";
import LineConnectionTab from "@/components/admin/line/LineConnectionTab";
import LineManualSendTab from "@/components/admin/line/LineManualSendTab";
import LineAutoNotificationTab from "@/components/admin/line/LineAutoNotificationTab";
import LineLogsTab from "@/components/admin/line/LineLogsTab";

export default function AdminLineSettings() {
  const [tab, setTab] = useState("connection");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">LINE Messaging 管理</h1>
        <p className="text-gray-500 text-sm mt-1">LINE Messaging APIの接続設定、メッセージ送信、自動通知、送信履歴を管理します。</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="connection" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Wifi className="w-4 h-4" />接続設定
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Send className="w-4 h-4" />手動送信
          </TabsTrigger>
          <TabsTrigger value="auto" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Bell className="w-4 h-4" />自動通知
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <ClipboardList className="w-4 h-4" />送信履歴
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connection"><LineConnectionTab /></TabsContent>
        <TabsContent value="manual"><LineManualSendTab /></TabsContent>
        <TabsContent value="auto"><LineAutoNotificationTab /></TabsContent>
        <TabsContent value="logs"><LineLogsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
