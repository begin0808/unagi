/**
 * 聯絡方式 —— 網站唯一的來源。
 *
 * 頁尾、訂購區、常見問題、以及 index.html 的商家結構化資料都用這裡的資料。
 * 換號碼或換信箱只要改這個檔案（結構化資料在 index.html 需另外手動改一次）。
 */

/** 訂購專線，依序顯示。請填純數字，顯示格式與撥號連結會自動產生 */
export const PHONES = ['0988317218', '0931675289', '0933587743'];

export const CONTACT_EMAIL = 'lynnyl168168@gmail.com';

/** 0988317218 → 0988-317-218 */
export const formatPhone = (p: string): string =>
  p.length === 10 ? `${p.slice(0, 4)}-${p.slice(4, 7)}-${p.slice(7)}` : p;

/** 手機點了可以直接撥號；轉成國際格式，出國或用網路電話也打得通 */
export const telHref = (p: string): string => `tel:+886${p.replace(/^0/, '')}`;

/** 純文字用的專線清單：0988-317-218 / 0931-675-289 / 0933-587-743 */
export const phoneListText = (): string => PHONES.map(formatPhone).join(' / ');
