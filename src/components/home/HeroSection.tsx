import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import heroSkincare from "@/assets/hero-skincare.jpg";
import heroFacial from "@/assets/hero-facial.jpg";
import heroMakeup from "@/assets/hero-makeup.jpg";

const heroImages = [heroSkincare, heroFacial, heroMakeup];

export function HeroSection() {
  const [currentImage, setCurrentImage] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isTextVisible, setIsTextVisible] = useState(false);

  useEffect(() => {
    setIsTextVisible(true);
  }, []);

  const changeImage = useCallback(() => {
    setIsFlashing(true);
    setTimeout(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
      setTimeout(() => setIsFlashing(false), 400);
    }, 300);
  }, []);

  useEffect(() => {
    const timer = setInterval(changeImage, 5000);
    return () => clearInterval(timer);
  }, [changeImage]);

  return (
    <section className="relative overflow-hidden bg-background py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left: Text */}
          <div
            className={`space-y-6 transition-all duration-700 ${
              isTextVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <Badge className="bg-pastel-pink/50 text-foreground border-pastel-pink/30 hover:bg-pastel-pink/60">
              ✨ インフルエンサー登録数 10,000人突破！
            </Badge>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-card-foreground">
              美容案件で輝く、
              <br />
              あなたの<span className="gradient-text">影響力</span>
            </h1>

            <p className="text-muted-foreground leading-relaxed max-w-md">
              PRizm Beautyは美容インフルエンサーと企業をつなぐマッチングプラットフォームです。
              あなたの発信力を活かして、美容ブランドとコラボレーションしましょう。
            </p>

            {/* LINE Login Button */}
            <Link to="/auth/login" className="inline-block">
              <button
                className="flex items-center h-14 md:h-16 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                style={{ backgroundColor: "#06C755" }}
              >
                <span className="flex items-center justify-center w-14 md:w-16 h-full">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 md:w-8 md:h-8" fill="white">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.271.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                </span>
                <span className="w-px h-8 bg-white/30" />
                <span className="px-5 md:px-6 text-white font-bold text-sm md:text-base">
                  LINEでログイン/新規登録
                </span>
              </button>
            </Link>

            <p className="text-xs text-muted-foreground">
              登録することで、
              <Link to="/terms" className="underline hover:text-primary">利用規約</Link>
              と
              <Link to="/privacy" className="underline hover:text-primary">プライバシーポリシー</Link>
              に同意したものとみなされます。
            </p>

            <div>
              <a
                href="https://pr-izm.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors underline"
              >
                掲載希望の企業さまはこちら →
              </a>
            </div>
          </div>

          {/* Right: Image */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-72 h-72 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem]">
              {heroImages.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Beauty ${i + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                    i === currentImage ? "opacity-100" : "opacity-0"
                  }`}
                  style={{
                    borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
                  }}
                />
              ))}
              {/* White flash overlay */}
              <div
                className={`absolute inset-0 bg-white transition-opacity duration-300 pointer-events-none ${
                  isFlashing ? "opacity-60" : "opacity-0"
                }`}
                style={{
                  borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
                }}
              />
            </div>
            {/* Decorative gradient blob */}
            <div className="absolute -z-10 w-full h-full gradient-pink-blue opacity-20 blur-3xl rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
