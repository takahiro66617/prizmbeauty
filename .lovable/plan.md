

# 画像アセットをサイトに組み込む計画

アップロードされた画像をPRizm Beautyサイトの各所に配置します。

---

## 対象ファイルと用途

| ファイル | 用途 | 配置先 |
|---------|------|--------|
| hero-skincare.jpg | トップページHeroセクションの背景/メイン画像 | src/assets/ |
| hero-facial.jpg | トップページまたはキャンペーン一覧のビジュアル | src/assets/ |
| hero-makeup.jpg | トップページまたはキャンペーン一覧のビジュアル | src/assets/ |
| line.png | ヘッダー・ログインページのLINEボタンアイコン | src/assets/ |

**注**: next.svg, vercel.svg, file.svg, globe.svg, window.svgはNext.jsのボイラープレートファイルのため、使用しません。

---

## 実装内容

### 1. アセットファイルのコピー

4つの画像を `src/assets/` フォルダにコピーし、ESモジュールとしてインポートできるようにします。

### 2. トップページ（Index.tsx）の更新

現在のHeroセクションはグラデーション背景のみですが、3枚のhero画像を活用します:

- hero-skincare.jpg、hero-facial.jpg、hero-makeup.jpgを**Heroセクションの背景画像カルーセル**または**3カラムのビジュアルグリッド**として配置
- 「3ステップ」セクションや「注目の案件」セクションの装飾画像としても活用可能

### 3. LINEアイコンの置き換え（Header.tsx / Login.tsx）

現在はインラインSVGでLINEアイコンを描画していますが、アップロードされた `line.png` に置き換えます:

- Header.tsx: LINEログインボタンのアイコン
- Login.tsx: LINEログインボタンのアイコン

### 4. モックデータの画像差し替え

`mockData.ts` のキャンペーン画像（現在Unsplash URL）の一部を、アップロードされた実画像に差し替えることも可能です。

---

## 技術詳細

- 画像は `src/assets/` に配置し、`import heroSkincare from "@/assets/hero-skincare.jpg"` のようにインポート
- LINEアイコンは `<img>` タグで表示（現在のインラインSVGを置換）
- Heroセクションでは `object-cover` で画像をレスポンシブ表示

