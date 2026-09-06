/**
 * 訂單價格與運費規則 —— 這是前端唯一的計價來源。
 *
 * 注意：Apps Script 後端 (gas/Code.gs) 會用同一套規則「重新計算一次」金額，
 * 並以後端算出來的數字為準。瀏覽器送來的金額一律不採信，
 * 因為前端的任何數值都能被使用者竄改。
 * 若這裡的價格有調整，gas/Code.gs 最上方的常數也要一起改。
 */

export type SpecId = 'A' | 'B' | 'C';

export interface SpecInfo {
  id: SpecId;
  name: string;
  detail: string;
  hint: string;
}

export const SPECS: SpecInfo[] = [
  { id: 'A', name: '霸氣大規格', detail: '3 條裝 / 1 公斤', hint: '厚切 Q 彈紮實' },
  { id: 'B', name: '經典人氣款', detail: '4 條裝 / 1 公斤', hint: '油脂與肉質黃金平衡' },
  { id: 'C', name: '軟嫩珍稀款', detail: '5 條裝 / 1 公斤', hint: '細膩柔嫩、溫和順口' },
];

/** 每包（1 公斤）售價 */
export const PRICE_PER_KG = 1000;

/** 送禮禮盒單價，每個可裝 3~4 片 */
export const GIFT_BOX_PRICE = 50;

/** 達到此包數即免運費 */
export const FREE_SHIPPING_PACKS = 5;

export const SHIPPING_TIERS = [
  { label: '2 公斤以下（1~2 包）', fee: 225 },
  { label: '3 ~ 4 公斤（3~4 包）', fee: 290 },
  { label: '5 公斤以上（5 包以上）', fee: 0 },
];

export type Quantities = Record<SpecId, number>;

export const EMPTY_QUANTITIES: Quantities = { A: 0, B: 0, C: 0 };

/**
 * 運費只看魚的包數（1 包 = 1 公斤）。
 * 送禮禮盒是既有魚片的外包裝，不另計入運費重量。
 */
export function shippingFee(packs: number): number {
  if (packs <= 0) return 0;
  if (packs <= 2) return 225;
  if (packs <= 4) return 290;
  return 0;
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
  const packs = SPECS.reduce((sum, spec) => sum + Math.max(0, quantities[spec.id] || 0), 0);
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

/** 建議的禮盒數量：每盒可裝 3~4 片，以每盒 4 片估算 */
export function suggestedGiftBoxes(quantities: Quantities): number {
  const fillets =
    (quantities.A || 0) * 3 + (quantities.B || 0) * 4 + (quantities.C || 0) * 5;
  return Math.ceil(fillets / 4);
}

export const currency = (n: number) => `$${n.toLocaleString('en-US')}`;
