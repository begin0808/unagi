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

/** 送禮禮盒單價，每個可裝 3~4 片 */
export const GIFT_BOX_PRICE = 50;

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
    detail: '【大口過癮】適合喜愛肉質厚實、豪邁大口吃肉的饕客老饕首選。',
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
  giftTotal: number;
  shipping: number;
  total: number;
  /** 還差幾包才免運，0 代表已免運或尚未選購 */
  packsToFreeShipping: number;
}

export function calcOrder(quantities: Quantities, giftBoxes: number): OrderTotals {
  const packs = PRODUCTS.reduce((sum, p) => sum + Math.max(0, quantities[p.id] || 0), 0);
  const boxes = Math.max(0, giftBoxes || 0);

  const itemsTotal = packs * PRICE_PER_KG;
  const giftTotal = boxes * GIFT_BOX_PRICE;
  const shipping = shippingFee(packs);

  return {
    packs,
    itemsTotal,
    giftTotal,
    shipping,
    total: itemsTotal + giftTotal + shipping,
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
