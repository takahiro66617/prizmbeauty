

## 都道府県セレクト選択時の白画面修正

### 原因

Radix UIのSelectコンポーネントはデフォルトでモーダル動作（フォーカストラップ）を行います。プレビューのiframe環境では、このフォーカス管理が画面全体のレンダリングと競合し、選択後に画面が真っ白になります。

### 修正内容

**ファイル: `src/pages/auth/RegisterProfile.tsx`（1箇所）**

都道府県のSelect部分を以下のように修正:

- `Select`コンポーネントに`modal={false}`を追加してフォーカストラップを無効化  
- `SelectContent`に`position="popper"`と高いz-indexを指定

```tsx
<Select value={prefecture} onValueChange={setPrefecture} modal={false}>
  <SelectTrigger>
    <SelectValue placeholder="都道府県を選択" />
  </SelectTrigger>
  <SelectContent position="popper" className="z-[9999] max-h-60 overflow-y-auto bg-popover">
    {PREFECTURES.map((p) => (
      <SelectItem key={p} value={p}>{p}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

### 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `src/pages/auth/RegisterProfile.tsx` | Selectに`modal={false}`追加、SelectContentに`position="popper"`とスタイル追加 |

