/**
 * Apps Script 網頁應用程式網址（訂單接收端點）。
 *
 * 這串網址本來就會出現在瀏覽器送出的請求裡，不是機密資料。
 * 若日後重新部署導致網址改變，改這裡即可；
 * 也可以用 .env 的 VITE_ORDER_API_URL 覆蓋而不動程式碼。
 */
export const DEFAULT_ORDER_API_URL =
  'https://script.google.com/macros/s/AKfycbyl618VsELEj8iVyk1dSKePNwB4aZ654_k6qjsBWjJxl8C7J1prPRHmF-NNOM1zxla7/exec';

export const ORDER_API_URL: string = import.meta.env.VITE_ORDER_API_URL || DEFAULT_ORDER_API_URL;

/** GAS 尚未設定或送單失敗時的備援管道 */
export const FALLBACK_FORM_URL =
  'https://docs.google.com/forms/d/1W9iyrVFahsreK_HU9wabdsL2WUhg054upirHDNxqVBA/viewform';

