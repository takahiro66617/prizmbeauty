import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, ExternalLink } from "lucide-react";

const LINE_FRIEND_ADD_URL = "https://line.me/R/ti/p/@616jfxwh";

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl: string | null;
}

export default function LineAddFriend() {
  const navigate = useNavigate();
  const [lineProfile, setLineProfile] = useState<LineProfile | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("lineProfile");
    if (!stored) {
      navigate("/auth/login");
      return;
    }
    setLineProfile(JSON.parse(stored));
  }, [navigate]);

  const handleAddFriend = () => {
    window.open(LINE_FRIEND_ADD_URL, "_blank");
  };

  const handleNext = () => {
    sessionStorage.setItem("lineFriendAdded", "true");
    navigate("/auth/register/profile");
  };

  if (!lineProfile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#06C755]/10 via-card to-pastel-pink/20 py-8 px-4">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold gradient-text">友だち追加</h1>
           <p className="text-muted-foreground text-sm">
             PRizmの公式LINEアカウントを<br />友だち追加してください
           </p>
        </div>

        <Card className="p-6 shadow-xl border-0 bg-card/90 backdrop-blur-sm rounded-2xl space-y-6">
          {/* LINE Profile */}
          {lineProfile.pictureUrl && (
            <div className="flex justify-center">
              <img
                src={lineProfile.pictureUrl}
                alt="プロフィール"
                className="w-16 h-16 rounded-full object-cover border-2 border-[#06C755]/30"
              />
            </div>
          )}
          <p className="text-center text-sm text-muted-foreground">
            ようこそ、<span className="font-semibold text-foreground">{lineProfile.displayName}</span> さん
          </p>

          {/* Explanation */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <p className="text-sm text-foreground font-medium">友だち追加が必要な理由</p>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
              <li>キャンペーン情報のお知らせ</li>
              <li>応募結果の通知</li>
              <li>メッセージの受信</li>
            </ul>
          </div>

          {/* Add Friend Button */}
          <Button
            onClick={handleAddFriend}
            className="w-full h-12 text-base font-bold bg-[#06C755] hover:bg-[#05B04C] text-white"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            友だち追加する
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>

          {/* Next Button */}
          <Button
            onClick={handleNext}
            variant="gradient"
            className="w-full h-12 text-base font-bold"
          >
            友だち追加しました → 次へ
          </Button>
        </Card>
      </div>
    </div>
  );
}
