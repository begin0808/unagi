/**
 * 商品、價格與運費規則 —— 網站唯一的資料來源。
 *
 * 規格卡片、訂購表單、FAQ 的運費說明全部由這裡產生，
 * 所以改價或改規格只需要動這個檔案一處。
 *
 * ⚠️ 唯一的例外是 Apps Script 後端（gas/Code.gs），它跑在 Google 的伺服器上
 * 無法 import 這個檔案，價格與運費規則必須手動同步過去。
 * 後端會用自己那份規則「重新計算」金額並以其為準——瀏覽器送來的數字
 * 任何人都能竄改，不能採信。
 */

export type SpecId = 'A' | 'B' | 'C';

/** 每包（1 公斤）售價 */
export const PRICE_PER_KG = 1000;

/** 原價，用於顯示折扣 */
export const ORIGINAL_PRICE_PER_KG = 1200;

/**
 * 送禮禮盒。
 *
 * 每條鰻魚都是單獨真空包裝，一個禮盒約可裝 3~4 條。
 * 因此「需要幾個禮盒」取決於要分送幾位對象，與買了幾公斤沒有直接關係：
 * 買 2 公斤小條魚（8 條）若要分送三個人，就需要 3 個禮盒。
 *
 * 規則：
 *   免費額度＝購買公斤數（1 公斤約可裝滿 1 個禮盒）
 *   數量上限＝總條數（極端情況一條一盒，不可能再更多）
 *   超過免費額度的部分，每個加購 GIFT_BOX_PRICE 元
 */
export const GIFT_BOX_CAPACITY = '3~4 條';

/** 加購禮盒單價 */
export const GIFT_BOX_PRICE = 50;

/** 免費禮盒額度：依購買公斤數 */
export function freeGiftBoxes(packs: number): number {
  return Math.max(0, packs);
}

/** 禮盒數量上限：依總條數 */
export function maxGiftBoxes(fillets: number): number {
  return Math.max(0, fillets);
}

/** 訂單的總條數（每條各自真空包裝） */
export function totalFillets(quantities: Quantities): number {
  return PRODUCTS.reduce(
    (sum, p) => sum + Math.max(0, quantities[p.id] || 0) * p.fillets,
    0,
  );
}

export type Packaging = 'self' | 'gift';

/**
 * 優惠碼折扣：以「商品金額」每滿 DISCOUNT_STEP_AMOUNT 元，折 DISCOUNT_STEP_VALUE 元，
 * 不足一階的零頭不計，不設上限。禮盒與運費不納入計算基準。
 *
 * ⚠️ 優惠碼本身「不在」這個檔案裡，也不在任何前端程式碼裡。
 * 網頁的程式碼所有人都看得到，優惠碼若寫在前端等於公開。
 * 實際的碼只存在 gas/Code.gs 的 PROMO_CODES，由後端驗證。
 */
export const DISCOUNT_STEP_AMOUNT = 1000;
export const DISCOUNT_STEP_VALUE = 50;

export function promoDiscount(itemsTotal: number): number {
  if (itemsTotal <= 0) return 0;
  return Math.floor(itemsTotal / DISCOUNT_STEP_AMOUNT) * DISCOUNT_STEP_VALUE;
}

/** 達到此包數即免運費 */
export const FREE_SHIPPING_PACKS = 5;

export const SHIPPING_TIERS = [
  { label: '2 公斤以下', packs: '1~2 包', fee: 225 },
  { label: '3 ~ 4 公斤', packs: '3~4 包', fee: 290 },
  { label: '5 公斤以上', packs: '5 包以上', fee: 0 },
];

/* ===================== 商品定義 ===================== */

/** 每個規格只需要定義這些，其餘顯示文字都由下方自動組出來 */
interface SpecSeed {
  id: SpecId;
  shortName: string;
  /** 每包幾尾 */
  fillets: number;
  /** 單片約幾公克 */
  gramsPerFillet: number;
  /** 一句話的口感提示，用於訂購表單 */
  hint: string;
  description: string;
  detail: string;
  tag: string;
  tagColor: string;
}

const SPEC_SEEDS: SpecSeed[] = [
  {
    id: 'A',
    shortName: '霸氣大規格',
    fillets: 3,
    gramsPerFillet: 333,
    hint: '厚切 Q 彈紮實',
    description: '魚身厚實寬大、肉質紮實且口感極富 Q 彈嚼勁！',
    detail: '【大口過癮】適合喜愛肉質厚實、豪邁大口吃肉的老饕首選。',
    tag: '厚切・Q彈紮實',
    tagColor: 'bg-amber-600',
  },
  {
    id: 'B',
    shortName: '經典人氣款',
    fillets: 4,
    gramsPerFillet: 250,
    hint: '油脂與肉質黃金平衡',
    description: '油脂豐潤度與肉質達到黃金完美平衡，滑順甘甜入口生香！',
    detail: '【中秋人氣王】烤肉架上最吸睛焦點，老饕評鑑最佳黃金比例。',
    tag: '人氣首選・油脂平衡',
    tagColor: 'bg-red-600',
  },
  {
    id: 'C',
    shortName: '軟嫩珍稀款',
    fillets: 5,
    gramsPerFillet: 200,
    hint: '細膩柔嫩、溫和順口',
    description: '肉質細膩柔嫩、入口即化，口感最為溫和順口！',
    detail: '【極致軟嫩】肉質細膩柔滑、入口即化，長輩與孩童享用的最佳安心首選。',
    tag: '極致軟嫩・細膩順口',
    tagColor: 'bg-emerald-600',
  },
];

export interface Product extends SpecSeed {
  code: SpecId;
  /** 卡片標題：霸氣大規格 (3條裝 / 1kg) */
  name: string;
  /** 訂購表單用：3 條裝 / 1 公斤 */
  packDetail: string;
  /** 卡片副標：每包 1 公斤 (約 3 尾，單片約 333g) */
  spec: string;
  price: number;
  originalPrice: number;
}

export const PRODUCTS: Product[] = SPEC_SEEDS.map((s) => ({
  ...s,
  code: s.id,
  name: `${s.shortName} (${s.fillets}條裝 / 1kg)`,
  packDetail: `${s.fillets} 條裝 / 1 公斤`,
  spec: `每包 1 公斤 (約 ${s.fillets} 尾，單片約 ${s.gramsPerFillet}g)`,
  price: PRICE_PER_KG,
  originalPrice: ORIGINAL_PRICE_PER_KG,
}));

/** 訂購表單用的精簡版規格清單 */
export const SPECS = PRODUCTS.map((p) => ({
  id: p.id,
  name: p.shortName,
  detail: p.packDetail,
  hint: p.hint,
}));

/* ===================== 計價 ===================== */

export type Quantities = Record<SpecId, number>;

export const EMPTY_QUANTITIES: Quantities = { A: 0, B: 0, C: 0 };

/**
 * 運費只看魚的包數（1 包 = 1 公斤）。
 * 送禮禮盒是既有魚片的外包裝，不另計入運費重量。
 */
export function shippingFee(packs: number): number {
  if (packs <= 0) return 0;
  if (packs <= 2) return SHIPPING_TIERS[0].fee;
  if (packs <= 4) return SHIPPING_TIERS[1].fee;
  return SHIPPING_TIERS[2].fee;
}

export interface OrderTotals {
  packs: number;
  itemsTotal: number;
  shipping: number;
  discount: number;
  total: number;
  /** 總條數，每條各自真空包裝 */
  fillets: number;
  /** 實際成立的禮盒數，已依上限修正過 */
  giftBoxes: number;
  /** 其中免費的數量 */
  freeBoxes: number;
  /** 其中需要加購的數量 */
  extraBoxes: number;
  /** 加購禮盒的金額 */
  giftTotal: number;
  /** 目前可選的禮盒數量上限 */
  maxBoxes: number;
  /** 還差幾包才免運，0 代表已免運或尚未選購 */
  packsToFreeShipping: number;
}

export function calcOrder(
  quantities: Quantities,
  packaging: Packaging,
  giftBoxes: number,
  promoApplied = false,
): OrderTotals {
  const packs = PRODUCTS.reduce((sum, p) => sum + Math.max(0, quantities[p.id] || 0), 0);
  const fillets = totalFillets(quantities);
  const maxBoxes = maxGiftBoxes(fillets);
  // 上限一律在這裡夾住：數量減少時，先前選的禮盒數不能超過新的上限
  const boxes = packaging === 'gift' ? Math.min(Math.max(0, giftBoxes || 0), maxBoxes) : 0;
  const freeBoxes = Math.min(boxes, freeGiftBoxes(packs));
  const extraBoxes = Math.max(0, boxes - freeBoxes);

  const itemsTotal = packs * PRICE_PER_KG;
  const giftTotal = extraBoxes * GIFT_BOX_PRICE;
  const shipping = shippingFee(packs);
  const discount = promoApplied ? promoDiscount(itemsTotal) : 0;

  return {
    packs,
    itemsTotal,
    shipping,
    discount,
    total: itemsTotal + giftTotal + shipping - discount,
    fillets,
    giftBoxes: boxes,
    freeBoxes,
    extraBoxes,
    giftTotal,
    maxBoxes,
    packsToFreeShipping:
      packs > 0 && packs < FREE_SHIPPING_PACKS ? FREE_SHIPPING_PACKS - packs : 0,
  };
}

export const currency = (n: number) => `$${n.toLocaleString('en-US')}`;

/** FAQ 的運費說明，直接由上面的級距產生，不另外手寫一份 */
export const shippingFaqLines = (): string =>
  SHIPPING_TIERS.map((t) =>
    t.fee === 0
      ? `• ${t.label}：🎉 全臺免運費！`
      : `• ${t.label}：運費 $${t.fee}`
  ).join('\n');
