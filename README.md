# ぷくともちの うんどうかい

シリーズ共通マニュアルに沿った全11ページの静的Web絵本です。表示・操作の基準は「たべあるき」です。

## 開く

```powershell
node scripts/serve.mjs
```

http://127.0.0.1:4173/ をブラウザで開きます。別のポートは環境変数 PORT で指定できます。

## 構成と操作

表紙 → 到着 → 準備運動 → かけっこ → 玉入れ → 障害物競走 → お昼休み → 大玉転がし → ゴール → 表彰 → 夕方の締め。

- 前後ボタン、ページドット、左右スワイプ、左右キー、Home / End。
- `#page-race` などで場面を直接表示。ブラウザの戻る・進むに対応。
- 最終ページの「おもいでを みる」で6カードを表示。カードから本編へ移動。
- 閉じるボタン、背景クリック、Escapeで思い出を閉じる。Tab移動とフォーカス復帰に対応。
- 音、自己紹介、章番号、ハートUI、背景装飾アニメーション、得点機能はありません。

## 表示

- PC：最大1280×860px、中央配置。本文は絵68％・文章32％。
- 幅820px以下：上に絵、下に文章。52:48、幅480px以下50:50、低い画面53:47。
- 文字・余白・ナビ・カードは食べ歩き版を継承。safe-areaと動きを抑える設定に対応。
- スマホ本編は既存3作品と同じobject-fit: coverで画像領域を埋めます。幅600px以下の縦画面では、背景の広い到着・玉入れ・大玉転がし・ゴールを場面ごとに1.12〜1.18倍、表紙・最終ページを1.1倍に拡大します。画像枠・本文・文字・ナビの寸法とPC表示は維持しています。
- 横に広い玉入れ・大玉転がし・ゴールは、幅600px以下の縦画面で専用構図を使用します。画像を引き伸ばさずに顔・耳の見切れを防ぎます。
- 表紙と最終ページはスマホ縦構図を追加。長いタイトルが顔を覆わないようPCの文字サイズを調整しました。
- ぷくは青緑、もちはオレンジのリュックを維持しています。

## 画像

`assets/sports-story-01.png`〜`10.png` が従来の10枚、`assets/sports-awards.png` が追加の表彰画像です。
`sports-cover-mobile.png` と `sports-ending-mobile.png` はスマホ表紙・最終ページ用。
組み込み image_gen で既存キャラクター画像から編集生成しました。プロンプトセットは `assets/image-prompts.txt`。
思い出カードは本編画像を再利用します。
スマホ用の追加3枚はsports-ball-toss-mobile.png、sports-teamwork-mobile.png、sports-goal-mobile.pngです。組み込みimage_genで既存画像を参照して制作し、プロンプトはassets/mobile-scenes-prompts.txtに記録しています。

## 検査

```powershell
node scripts/check-static.mjs
node scripts/check-browser.cjs
node scripts/inspect-layout.cjs
node scripts/compare-mobile.cjs
```

ブラウザ検査はローカルサーバー起動中に実行します。PlaywrightとMicrosoft Edgeが必要です。
Playwrightは通常のnode_modules、または使用中のNodeランタイムに同梱されたnode_modulesから読み込みます。
`TEST_URL` と `BROWSER_CHANNEL` で検査先とブラウザを変更できます。
本番の絵本自体にNodeやPlaywrightの依存はありません。

確認済み：Chromium / Edgeで320×568、375×667、390×844、430×932、820×1180、821×1180、1440×1000、1280×720、390×600、800×500の全11ページ。
ページ送り・連打・ドット・履歴・直接URL・スワイプ相当のポインターイベント・モーダル・フォーカスを自動検査。
全ページのPC/スマホ画像と思い出一覧を目視確認。検証画像は `artifacts/` に出力します。

未確認：実機iPhone Safari、ホーム画面追加後の表示、実指でのスワイプ。エミュレーションの検査結果と区別しています。
シリーズ比較スクリプトは親フォルダの山・海・食べ歩きを読み取り専用で開きます。320・375・390・430px幅で本体幅、ナビ幅、見出しサイズ、ボタン高、表示倍率が一致することを検査します。PCの比較基準がartifacts/before-comparison.jsonにある場合はPC寸法が変わらないことも確認します。

## GitHub Pages

専用リポジトリ： https://github.com/orbitcraf/puku-mochi-undoukai

公開URL： https://orbitcraf.github.io/puku-mochi-undoukai/

山・海シリーズと同じGitHub Actions方式です。mainへのpushまたは手動実行で、静的検査後にGitHub Pagesへ公開します。
Settings → Pages → Source は GitHub Actions を使用します。
配信物はindex.html・styles.css・app.js・assets内のPNGのみです。検証画像、検査スクリプト、制作プロンプトは配信物に含めません。
既存3作品と親マニュアルは変更していません。


