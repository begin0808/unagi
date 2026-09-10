# 興旺蒲燒鰻 官方網站

彰化縣福興鄉吳奇清養鰻場「興旺蒲燒鰻」的品牌官網與線上訂購系統。

- 正式站：<https://xingwang-unagi.vercel.app/>
- 技術：React + TypeScript + Vite + Tailwind CSS，部署於 Vercel（推送到 `main` 自動部署）

## 頁面

| 路徑 | 內容 | 原始檔 |
|---|---|---|
| `/` | 首頁：品牌故事、規格與售價、加熱方式、常見問題、線上訂購 | `src/App.tsx` |
| `/ACR.html` | 日本水產月刊《ACR》專訪報導中日對照全譯 | `ACR.html`（獨立靜態頁，未使用 React） |

> `ACR.html` 位於**專案根目錄**，由 `vite.config.ts` 指定為第二個建置入口。
> 請勿在 `public/` 底下另建一份，兩者會搶同一個輸出檔名。

## 開發

```bash
npm install
npm run dev      # 本機開發
npm run build    # 建置到 dist/
npm run preview  # 預覽建置結果
```

## 改價格、規格或運費

**只改 `src/lib/pricing.ts` 一個檔案。** 規格卡片、訂購表單、FAQ 的運費說明都由它產生。

唯一的例外是 **`gas/Code.gs`**（Google Apps Script 後端）。它跑在 Google 的伺服器上，
無法 import 專案檔案，價格與運費規則必須**手動同步**過去，並重新部署。

後端會用自己那份規則重新計算金額並以其為準——瀏覽器送來的數字任何人都能竄改，不能採信。
所以兩邊不同步時，客人看到的金額和實際記錄的金額會不一致。

## 線上訂購系統

顧客在網站上送出訂單 → Google Apps Script → 寫入 Google 試算表 → 寄通知信給店家與顧客。

- 前端：`src/components/OrderForm.tsx`
- 後端：`gas/Code.gs`、`gas/appsscript.json`
- **設定與部署步驟：[`docs/訂購系統設定說明.md`](docs/訂購系統設定說明.md)**

### 送禮禮盒

每條鰻魚單獨真空包裝，一個禮盒約可裝 3~4 條。
免費額度＝購買公斤數，超過的部分每個加購 `GIFT_BOX_PRICE`，數量上限＝總條數。
規則在 `pricing.ts` 與 `gas/Code.gs` 各有一份，改動時兩邊都要改；
前後端都會夾住上限並各自算一次金額，以後端為準。

### 付款方式

宅配訂單可選銀行轉帳或 LINE Pay；自取／面交的訂單另可選取貨時付現，且免運費。
收款帳戶與 LINE Pay 的 LINE ID 設定在 `gas/Code.gs` 的 `BANK_INFO`、`LINE_PAY_INFO`（帳號與 LINE ID 建議只在 Apps Script 裡填），
轉帳訂單成立後只寫進顧客確認信，不回傳給網頁（要填真實的 Email 才拿得到帳號）。
付款期限 `PAYMENT_DEADLINE_HOURS` 在 `pricing.ts` 與 `Code.gs` 各有一份，改動時兩邊都要改。

### 優惠碼

優惠碼與各自的折扣額度只存在 `gas/Code.gs` 的 `PROMO_CODES`，
**不可以寫進網站程式碼**——網頁原始碼是公開的。

折扣公式是「商品金額每滿 `DISCOUNT_STEP_AMOUNT` 元折抵一次」，每一階折多少由碼決定；
客人輸入正確的碼後，後端才把額度回傳給前端計算。金額仍以後端重算的結果為準。

Apps Script 的部署網址寫在 `OrderForm.tsx` 的 `DEFAULT_ORDER_API_URL`，
也可用環境變數 `VITE_ORDER_API_URL` 覆蓋（見 `.env.example`）。

## 改聯絡電話或信箱

改 `src/lib/contact.ts` 一個檔案即可，頁尾、訂購區與常見問題都會跟著更新。

但 `index.html` 的 LocalBusiness 結構化資料（`telephone`、`email`、`contactPoint`）
是靜態 JSON，需要另外手動改一次。

## 換網域時要一起改的地方

目前站台網址寫死在幾個檔案裡，若日後綁定自訂網域，這些都要更新：

- `index.html`：`og:url`、`twitter:url`、`canonical`、兩段 JSON-LD 內的網址
- `ACR.html`：`canonical` 與 JSON-LD 內的網址
- `public/robots.txt`、`public/sitemap.xml`

## 圖片

`public/images/` 與 `public/acr_images/`。加入新圖前請先壓縮——首頁背景圖是
最影響載入速度的資產。除首屏背景外，所有 `<img>` 都應加上 `loading="lazy"`。
