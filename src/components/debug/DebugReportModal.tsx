import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Send, X, Loader2 } from "lucide-react";
import { useDebugMode } from "./DebugModeProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DebugReportModal({ open, onOpenChange }: Props) {
  const { getSessionData, stopSession } = useDebugMode();
  const [comment, setComment] = useState("");
  const [screenshot, setScreenshot] = useState<Blob | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const session = getSessionData();

  const captureScreenshot = async () => {
    setCapturing(true);
    onOpenChange(false);
    await new Promise(r => setTimeout(r, 300));
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(document.body);
      canvas.toBlob(blob => {
        if (blob) {
          setScreenshot(blob);
          setScreenshotPreview(URL.createObjectURL(blob));
        }
        setCapturing(false);
        onOpenChange(true);
      });
    } catch {
      setCapturing(false);
      onOpenChange(true);
      toast.error("スクリーンショットの取得に失敗しました");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    setScreenshotPreview(null);
  };

  const handleSubmit = async () => {
    if (!comment && !screenshot) return;
    if (!session) return;
    setSending(true);

    try {
      let screenshotUrl: string | null = null;

      if (screenshot) {
        const filename = `${session.sessionId}_${Date.now()}.png`;
        const { error: upErr } = await supabase.storage
          .from("debug-screenshots")
          .upload(filename, screenshot, { contentType: "image/png" });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage
          .from("debug-screenshots")
          .getPublicUrl(filename);
        screenshotUrl = urlData.publicUrl;
      }

      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase.from("debug_reports" as any).insert({
        session_id: session.sessionId,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        comment: comment || null,
        screenshot_url: screenshotUrl,
        error_logs: session.errorLogs,
        console_logs: session.consoleLogs,
        network_logs: session.networkLogs,
        interaction_logs: session.interactionLogs,
        user_id: userData?.user?.id || null,
      } as any);

      if (error) throw error;

      toast.success("バグレポートを送信しました");
      setComment("");
      removeScreenshot();
      onOpenChange(false);
      stopSession();
    } catch (err: any) {
      toast.error("送信に失敗しました: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const canSubmit = !!(comment || screenshot);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>バグレポート送信</DialogTitle>
          <DialogDescription>発見した問題の詳細を入力してください</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Screenshot */}
          <div>
            <Label>スクリーンショット</Label>
            <div className="flex gap-2 mt-1">
              <Button type="button" variant="outline" size="sm" onClick={captureScreenshot} disabled={capturing}>
                <Camera className="w-4 h-4 mr-1" />
                {capturing ? "撮影中..." : "画面キャプチャ"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4 mr-1" />
                画像アップロード
              </Button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </div>
            {screenshotPreview && (
              <div className="relative mt-2 inline-block">
                <img src={screenshotPreview} alt="screenshot" className="max-h-48 rounded border" />
                <button onClick={removeScreenshot} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Comment */}
          <div>
            <Label>コメント</Label>
            <Textarea
              rows={4}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="どのような操作をしたときに、どのようなバグが発生しましたか？"
              className="mt-1"
            />
          </div>

          {/* Session info */}
          {session && (
            <div className="text-xs text-muted-foreground space-y-0.5 bg-muted/50 rounded p-2">
              <p>セッションID: {session.sessionId}</p>
              <p>エラーログ: {session.errorLogs.length}件</p>
              <p>ネットワークログ: {session.networkLogs.length}件</p>
              <p>操作ログ: {session.interactionLogs.length}件</p>
              <p>ページ: {window.location.pathname}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || sending}>
            {sending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
            送信
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
