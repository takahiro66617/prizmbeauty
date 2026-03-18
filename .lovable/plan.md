

## 現状の問題

現在のコードは「いずれか1つのSNS」で `hasSnsInfo = true` になる設計ですが、ユーザーの要望は **InstagramとX（Twitter）の両方が必須** です。

さらに、現在のロジックでは `hasAnySnsUrl || hasAnyFollowers` としており、URLだけ or フォロワー数だけでOKになっています。しかし実際にはRLSやデータの状態によって正しく判定できていない可能性があります。

## 修正内容

### `src/hooks/useInfluencerReadiness.ts`

1. `hasSnsInfo` を `hasInstagram` と `hasTwitter` の2つの状態に分割
2. 判定ロジック:
   - **Instagram OK**: `instagram_url` が存在する、または `instagram_followers > 0`
   - **X (Twitter) OK**: `twitter_url` が存在する、または `twitter_followers > 0`
3. `isReady` = `hasBankAccount && hasInstagram && hasTwitter`
4. `missingItems` を個別表示:
   - Instagram未登録 → 「Instagramアカウント情報」
   - X未登録 → 「X（Twitter）アカウント情報」
   - 口座未登録 → 「振込先口座情報」
5. **両方登録済みなら警告バナーは表示されない**（`missingItems` が空になるため）

既存のダッシュボード・案件詳細の警告バナーは `missingItems.length > 0` で表示制御しているため、フックの修正だけで正しく消えます。

