import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, ChevronRight, QrCode, ArrowLeft } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { buildLineOAuthUrl } from "@/lib/lineAuth";

const LINE_FRIEND_ADD_URL = "https://line.me/R/ti/p/@616jfxwh";
const LINE_QR_URL = "https://qr-official.line.me/sid/M/616jfxwh.png";

export default function LineAddFriend() {
  const [confirmed, setConfirmed] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const handleNext = () => {
    // Proceed to LINE OAuth with aggressive bot_prompt for friend-add
    window.location.href = buildLineOAuthUrl("aggressive");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#06C755]/10 via-card to-pastel-pink/20 py-8 px-4">
      <div className="w-full max-w-md mx-auto space-y-6">
        <Link to="/auth/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> ログインに戻る
        </Link>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold gradient-text">友だち追加</h1>
          <p className="text-muted-foreground text-sm">
            PRizmの公式LINEアカウントを<br />友だち追加してください
          </p>
        </div>

        <Card className="p-6 shadow-xl border-0 bg-card/90 backdrop-blur-sm rounded-2xl space-y-6">
          {/* Official Account Info */}
          <div className="bg-[#06C755]/5 border border-[#06C755]/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full border-2 border-[#06C755]/30 bg-white flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={logoImg}
                  alt="PRizm公式アカウント"
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.innerHTML =
                        '<span style="font-size:1.25rem;font-weight:700;color:#06C755">P</span>';
                    }
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-base">PRizm（プリズム）</p>
                <p className="text-xs text-muted-foreground">LINE公式アカウント</p>
                <p className="text-xs text-muted-foreground font-mono">@616jfxwh</p>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <p className="text-sm text-foreground font-medium">友だち追加が必要な理由</p>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
              <li>案件の採用通知やリマインドをLINEでお届けします</li>
              <li>重要な連絡を見逃さないために必要です</li>
            </ul>
          </div>

          {/* Step 1: Add friend */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">STEP 1: 友だち追加</p>
            <a
              href={LINE_FRIEND_ADD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full h-12 text-base font-bold bg-[#06C755] hover:bg-[#05B04C] text-white rounded-full gap-2 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              友だち追加する
            </a>

            <button
              type="button"
              onClick={() => setShowQr(!showQr)}
              className="flex items-center justify-center w-full gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              <QrCode className="w-4 h-4" />
              {showQr ? "QRコードを閉じる" : "QRコードで追加する"}
            </button>

            {showQr && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-3">
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    <img
                      src={LINE_QR_URL}
                      alt="LINE友だち追加QRコード"
                      className="w-48 h-48"
                      onError={(e) => {
                        e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(LINE_FRIEND_ADD_URL)}`;
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  LINEアプリのQRコードリーダーで<br />スキャンしてください
                </p>
              </div>
            )}
          </div>

          {/* Step 2: Confirm and proceed */}
          <div className="space-y-3 border-t pt-4">
            <p className="text-sm font-semibold text-foreground">STEP 2: 確認して次へ</p>
            <div className="flex items-start gap-2">
              <Checkbox
                id="confirm-added"
                checked={confirmed}
                onCheckedChange={(v) => setConfirmed(v === true)}
                className="mt-0.5"
              />
              <label htmlFor="confirm-added" className="text-sm text-foreground cursor-pointer leading-snug">
                上記アカウントを友だち追加しました
              </label>
            </div>

            <Button
              onClick={handleNext}
              variant="gradient"
              className="w-full h-12 text-base font-bold"
              disabled={!confirmed}
            >
              次へ進む（LINE認証）
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              次のステップでLINEアカウントの認証を行います
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
