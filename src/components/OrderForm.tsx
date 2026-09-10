import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Minus, Plus, Gift, Truck, ShoppingBag, CheckCircle2, AlertTriangle,
  Loader2, X, ExternalLink, ClipboardList, Ticket, CheckCircle, ChevronRight, Leaf,
  Wallet, Landmark, Banknote, MapPin, Mail, Smartphone,
} from 'lucide-react';
import {
  SPECS, PRICE_PER_KG, SHIPPING_TIERS, FREE_SHIPPING_PACKS, PAYMENT_DEADLINE_HOURS,
  GIFT_BOX_CAPACITY, GIFT_BOX_PRICE,
  calcOrder, currency,
  type Quantities, type SpecId, type Packaging, type Delivery,
} from '../lib/pricing';

/**
 * Apps Script 網頁應用程式網址（訂單接收端點）。
 *
 * 這串網址本來就會出現在瀏覽器送出的請求裡，不是機密資料。
 * 若日後重新部署導致網址改變，改這裡即可；
 * 也可以用 .env 的 VITE_ORDER_API_URL 覆蓋而不動程式碼。
 */
const DEFAULT_ORDER_API_URL =
  'https://script.google.com/macros/s/AKfycbyl618VsELEj8iVyk1dSKePNwB4aZ654_k6qjsBWjJxl8C7J1prPRHmF-NNOM1zxla7/exec';

const ORDER_API_URL: string = import.meta.env.VITE_ORDER_API_URL || DEFAULT_ORDER_API_URL;

/** GAS 尚未設定或送單失敗時的備援管道 */
const FALLBACK_FORM_URL =
  'https://docs.google.com/forms/d/1W9iyrVFahsreK_HU9wabdsL2WUhg054upirHDNxqVBA/viewform';

type Step = 'form' | 'confirm' | 'sending' | 'done' | 'error';
type PromoState = 'idle' | 'checking' | 'ok' | 'bad';
/** 付款方式：銀行轉帳、LINE Pay，或取貨時付現（僅限自取／面交） */
type Payment = 'transfer' | 'linepay' | 'cash';

interface Props {
  quantities: Quantities;
  setQuantities: React.Dispatch<React.SetStateAction<Quantities>>;
}

const Stepper = ({
  value, onChange, min = 0, max = 99, label,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  label: string;
}) => (
  <div className="flex items-center gap-1 bg-stone-900 rounded-xl border border-white/15 p-1">
    <button
      type="button"
      aria-label={`減少${label}`}
      onClick={() => onChange(Math.max(min, value - 1))}
      disabled={value <= min}
      className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-stone-300 hover:bg-stone-700 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
    >
      <Minus size={16} />
    </button>
    <input
      type="number"
      inputMode="numeric"
      aria-label={label}
      value={value}
      min={min}
      max={max}
      onChange={(e) => {
        const n = parseInt(e.target.value, 10);
        onChange(Number.isNaN(n) ? min : Math.min(max, Math.max(min, n)));
      }}
      className="w-10 sm:w-12 bg-transparent text-center text-lg font-bold text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
    <button
      type="button"
      aria-label={`增加${label}`}
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-stone-300 hover:bg-amber-600 hover:text-stone-950 disabled:opacity-30 transition-colors"
    >
      <Plus size={16} />
    </button>
  </div>
);

const Field = ({
  id, label, required, error, hint, children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-bold text-stone-200 mb-1.5">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
      {hint && <span className="font-normal text-stone-400 text-xs ml-2">{hint}</span>}
    </label>
    {children}
    {error && (
      <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
        <AlertTriangle size={12} /> {error}
      </p>
    )}
  </div>
);

const inputClass =
  'w-full bg-stone-900 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-stone-500 outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/40 transition-colors aria-[invalid=true]:border-red-500/70 aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-red-500/30';

/**
 * 必填欄位由上到下的順序（錯誤代號 → 要跳過去的元素 id）。
 * 按「確認訂單內容」檢查失敗時，跳到第一個有問題的欄位。
 */
const FIELD_ORDER: [string, string][] = [
  ['packs', 'order-specs'],
  ['name', 'of-name'],
  ['phone', 'of-phone'],
  ['address', 'of-address'],
  ['email', 'of-email'],
  ['last5', 'of-last5'],
];

const OrderForm = ({ quantities, setQuantities }: Props) => {
  const [packaging, setPackaging] = useState<Packaging>('self');
  const [giftBoxes, setGiftBoxes] = useState(1);
  // 包數變少導致禮盒超過上限時，自動下修並提示，避免出現「買 3 包配 5 個禮盒」
  const [boxAdjusted, setBoxAdjusted] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [company, setCompany] = useState(''); // honeypot：真人不會看到也不會填
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<Step>('form');
  const [orderNo, setOrderNo] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 取貨與付款
  const [delivery, setDelivery] = useState<Delivery>('ship');
  const [pickupNote, setPickupNote] = useState('');
  const [payment, setPayment] = useState<Payment>('transfer');
  const [payerName, setPayerName] = useState('');
  const [last5, setLast5] = useState('');
  // 訂單成立後由後端回傳，顯示在完成畫面。
  // 匯款帳號與 LINE ID 刻意不回傳給網頁、只寫在確認信裡：要填真實的 Email 才拿得到。
  const [payInfoInEmail, setPayInfoInEmail] = useState(true);
  const [payDeadline, setPayDeadline] = useState('');
  const [finalTotal, setFinalTotal] = useState(0);

  // 優惠碼：輸入框內容與「已成功套用」的碼分開存，
  // 客人改動輸入框時要立刻取消已套用狀態，避免看到與實際不符的金額。
  const [promoInput, setPromoInput] = useState('');
  const [appliedCode, setAppliedCode] = useState('');
  /** 這組碼每滿一階折抵多少，由後端驗證後回傳 */
  const [appliedStep, setAppliedStep] = useState(0);
  const [promoState, setPromoState] = useState<PromoState>('idle');

  /**
   * 手機版底部浮動列：桌機的訂單摘要是固定在右側的，手機上卻排在表單最下方，
   * 客人在上面調數量時看不到金額變化。
   * 只在「摘要還在畫面下方、尚未捲到」時顯示；捲過去之後就交還給摘要本身，
   * 這樣浮動列也不會擋到頁尾。
   */
  const summaryRef = useRef<HTMLDivElement>(null);
  const [summaryBelow, setSummaryBelow] = useState(true);

  useEffect(() => {
    // 這裡刻意不用 IntersectionObserver：它只在「跨越邊界」時回報，
    // 若一次捲動就從摘要上方跳到下方（錨點跳轉、跳到頁尾），中間沒有交集狀態，
    // 觀察器不會觸發，浮動列就會卡住不消失。直接量位置才是每個捲動位置都正確。
    let ticking = false;
    const update = () => {
      const el = summaryRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      setSummaryBelow(top > window.innerHeight - 80);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; update(); });
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const goToSummary = () =>
    summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const totals = useMemo(
    () => calcOrder(quantities, packaging, giftBoxes, appliedStep, delivery),
    [quantities, packaging, giftBoxes, appliedStep, delivery],
  );

  // 上限縮小時把選擇拉回合法範圍，並讓客人看到被調整了
  useEffect(() => {
    if (packaging !== 'gift') return;
    if (giftBoxes > totals.maxBoxes) {
      setGiftBoxes(totals.maxBoxes);
      setBoxAdjusted(true);
    }
  }, [totals.maxBoxes, packaging, giftBoxes]);

  const chooseGiftBoxes = (v: number) => {
    setGiftBoxes(v);
    setBoxAdjusted(false);
  };

  const choosePackaging = (v: Packaging) => {
    setPackaging(v);
    setBoxAdjusted(false);
    if (v === 'gift' && giftBoxes < 1) setGiftBoxes(1);
  };

  // 付現只限自取／面交：改回宅配時，付款方式一併改回轉帳
  const chooseDelivery = (v: Delivery) => {
    setDelivery(v);
    if (v === 'ship' && payment === 'cash') setPayment('transfer');
  };

  /**
   * 還沒設定 Apps Script 網址時（例如剛部署、環境變數尚未填），
   * 不讓顧客白填一輪再失敗：改為只保留金額試算，並導向備援訂購單。
   */
  const configured = Boolean(ORDER_API_URL);

  /**
   * 優惠碼一律送到後端驗證。
   * 碼本身不能放在前端，網頁程式碼是公開的，寫在這裡等於直接送給所有人。
   */
  const verifyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setPromoState('checking');
    try {
      const res = await fetch(ORDER_API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'verifyPromo', code }),
      });
      const data = await res.json();
      if (data && data.ok && data.valid) {
        setAppliedCode(code);
        setAppliedStep(Number(data.discountPerStep) || 0);
        setPromoState('ok');
      } else {
        setAppliedCode('');
        setAppliedStep(0);
        setPromoState('bad');
      }
    } catch {
      setAppliedCode('');
      setAppliedStep(0);
      setPromoState('bad');
    }
  };

  const onPromoInputChange = (v: string) => {
    setPromoInput(v);
    if (appliedCode || promoState !== 'idle') {
      setAppliedCode('');
      setAppliedStep(0);
      setPromoState('idle');
    }
  };

  /** 確認視窗用：「匯款人 王小明，後五碼 01234」 */
  const payerLabel = [
    payerName.trim() && `匯款人 ${payerName.trim()}`,
    last5.trim() && `後五碼 ${last5.trim()}`,
  ].filter(Boolean).join('，');

  const setQty = (id: SpecId, n: number) =>
    setQuantities((prev) => ({ ...prev, [id]: n }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (totals.packs < 1) next.packs = '請至少選擇 1 公斤的商品';
    if (!name.trim()) next.name = '請填寫收件人姓名';
    if (!phone.trim()) next.phone = '請填寫聯絡電話';
    else if (!/^[\d\-+()\s]{8,20}$/.test(phone.trim())) next.phone = '電話格式看起來不正確';
    if (delivery === 'ship') {
      if (!address.trim()) next.address = '請填寫收件地址';
      else if (/自取|面交/.test(address))
        next.address = '要自取或面交的話，請在上方「取貨方式」選擇「自取／面交」';
      else if (address.trim().length < 8)
        next.address = '請填寫完整地址（含縣市與門牌號碼）';
    }
    if (!email.trim()) next.email = '請填寫 Email，我們會寄送訂單確認信給您核對';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = 'Email 格式看起來不正確';
    if (payment === 'transfer' && last5.trim() && !/^[0-9]{5}$/.test(last5.trim()))
      next.last5 = '請填寫 5 位數字；不確定的話可以先留空，轉帳後再回覆確認信告知';
    setErrors(next);
    return next;
  };

  const handleReview = () => {
    setTriedReview(true);
    const errs = validate();
    const first = FIELD_ORDER.find(([key]) => errs[key]);
    if (!first) {
      setStep('confirm');
      return;
    }
    // 手機版的收件資料排在很下面，不跳過去的話客人看不到紅字，只會以為按鈕壞了
    const el = document.getElementById(first[1]);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // 直接把游標放進欄位；preventScroll 讓上面的平滑捲動不被打斷
    if (el instanceof HTMLInputElement) el.focus({ preventScroll: true });
  };

  // 按過一次「確認訂單內容」之後，邊填邊重新檢查：改好的欄位紅字立刻消失
  const [triedReview, setTriedReview] = useState(false);
  useEffect(() => {
    if (triedReview) validate();
  }, [triedReview, name, phone, address, email, last5, delivery, payment, totals.packs]);

  const handleSubmit = async () => {
    setStep('sending');
    setErrorMsg('');
    try {
      if (!ORDER_API_URL) throw new Error('尚未設定訂單接收網址');

      const res = await fetch(ORDER_API_URL, {
        method: 'POST',
        // 刻意不設 Content-Type：字串 body 會以 text/plain 送出，
        // 屬於「簡單請求」，不會觸發 CORS 預檢，Apps Script 才收得到。
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          address: (delivery === 'ship' ? address : pickupNote).trim(),
          email: email.trim(),
          note: note.trim(),
          quantities,
          packaging,
          giftBoxes: totals.giftBoxes,
          promoCode: appliedCode,
          delivery,
          payment,
          payerName: payment === 'transfer' ? payerName.trim() : '',
          last5: payment === 'transfer' ? last5.trim() : '',
          company, // honeypot
        }),
      });

      const data = await res.json();
      if (!data || !data.ok) throw new Error(data?.message || '訂單未能成立');

      setOrderNo(data.orderNo || '');
      // 舊版後端回傳的欄位名稱是 bankInEmail
      setPayInfoInEmail((data.payInfoInEmail ?? data.bankInEmail) !== false);
      setPayDeadline(data.payDeadline || '');
      // 以後端重算的金額為準
      setFinalTotal(Number(data.total) || totals.total);
      setStep('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '未知錯誤');
      setStep('error');
    }
  };

  const resetAll = () => {
    setQuantities({ A: 0, B: 0, C: 0 });
    setPackaging('self');
    setGiftBoxes(1);
    setBoxAdjusted(false);
    setName(''); setPhone(''); setAddress(''); setEmail(''); setNote('');
    setErrors({});
    setTriedReview(false);
    setPromoInput('');
    setAppliedCode('');
    setAppliedStep(0);
    setPromoState('idle');
    setDelivery('ship');
    setPickupNote('');
    setPayment('transfer');
    setPayerName('');
    setLast5('');
    setPayInfoInEmail(true);
    setPayDeadline('');
    setFinalTotal(0);
    setStep('form');
  };

  // ---------- 完成畫面 ----------
  if (step === 'done') {
    return (
      <div className="bg-stone-800 rounded-3xl border border-green-500/40 p-8 sm:p-12 text-center shadow-2xl">
        <div className="w-20 h-20 rounded-full bg-green-500/15 text-green-400 flex items-center justify-center mx-auto mb-5 border border-green-500/30">
          <CheckCircle2 size={44} />
        </div>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">訂單已成功送出！</h3>
        {orderNo && (
          <p className="text-stone-300 mb-2">
            您的訂單編號：<span className="text-amber-400 font-bold tracking-wider">{orderNo}</span>
          </p>
        )}
        {payment !== 'cash' ? (
          <div className="max-w-md mx-auto my-6 text-left bg-stone-900 rounded-2xl border border-amber-500/40 p-5">
            <div className="flex items-center gap-2 text-amber-300 font-bold mb-3">
              {payment === 'linepay'
                ? <><Smartphone size={18} /> 請以 LINE Pay 付款 {currency(finalTotal)}</>
                : <><Landmark size={18} /> 請匯款 {currency(finalTotal)}</>}
            </div>
            {/* 每個子句各自 inline-block，窄螢幕只在子句之間換行 */}
            {payInfoInEmail ? (
              <p className="text-stone-200 text-sm leading-relaxed">
                <span className="inline-block">
                  <Mail size={14} className="inline -mt-0.5 mr-1 text-amber-300" />
                  {payment === 'linepay' ? '賣家的 LINE ID 已寄到' : '匯款帳號已寄到'}
                </span>{' '}
                {/* Email 自成一塊：放不下時整串換到下一行，不從中間斷開 */}
                <span className="inline-block">
                  <span className="text-white font-bold break-all">{email.trim()}</span>，
                </span>
                <span className="inline-block">
                  {payDeadline
                    ? <>請於 <strong className="text-amber-200 whitespace-nowrap">{payDeadline}</strong> 前完成{payment === 'linepay' ? '付款' : '匯款'}。</>
                    : <>請於下單後 {PAYMENT_DEADLINE_HOURS} 小時內完成{payment === 'linepay' ? '付款' : '匯款'}。</>}
                </span>
              </p>
            ) : (
              <p className="text-stone-300 text-sm leading-relaxed">
                <span className="inline-block">我們會盡快與您聯繫，提供{payment === 'linepay' ? ' LINE Pay 付款方式' : '匯款帳號'}。</span>
                <span className="inline-block">
                  {payDeadline
                    ? <>請於 <strong className="text-amber-200 whitespace-nowrap">{payDeadline}</strong> 前完成{payment === 'linepay' ? '付款' : '匯款'}。</>
                    : <>請於下單後 {PAYMENT_DEADLINE_HOURS} 小時內完成{payment === 'linepay' ? '付款' : '匯款'}。</>}
                </span>
              </p>
            )}
            <div className="text-stone-400 text-xs leading-relaxed mt-3 space-y-1">
              {payInfoInEmail && <p>沒看到信的話，請先查看垃圾郵件匣。</p>}
              {payment === 'linepay' ? (
                <p>
                  <span className="inline-block">加好友後以 LINE Pay 轉帳，</span>
                  <span className="inline-block">轉帳留言請填訂單編號 <span className="text-stone-200 whitespace-nowrap">{orderNo}</span>，</span>
                  <span className="inline-block">方便我們核對。</span>
                </p>
              ) : payerName.trim() || last5.trim() ? (
                <p>入帳後我們會依您填寫的匯款資料核對。</p>
              ) : (
                <p>
                  <span className="inline-block">轉帳後請回覆確認信，</span>
                  <span className="inline-block">告知匯款人姓名或帳號後五碼，</span>
                  <span className="inline-block">方便我們核對。</span>
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto my-6 text-left bg-stone-900 rounded-2xl border border-green-500/40 p-5">
            <div className="flex items-center gap-2 text-green-400 font-bold mb-2">
              <Banknote size={18} /> 取貨時付現 {currency(finalTotal)}
            </div>
            <p className="text-stone-300 text-sm leading-relaxed">
              我們會盡快與您聯繫，約定自取或面交的時間與地點。
            </p>
          </div>
        )}

        {/* 每個子句各自 inline-block：避免 JSX 換行產生的空白造成斷行，
            也讓窄螢幕只會在子句之間換行，不會把詞拆開 */}
        <p className="text-stone-400 text-sm sm:text-base leading-relaxed max-w-md mx-auto mb-8 [text-wrap:balance]">
          <span className="inline-block">訂單確認信已寄至您填寫的 Email，</span>
          <span className="inline-block">請收信核對訂購內容。</span>
          <span className="inline-block">若有任何需要更正的地方，</span>
          <span className="inline-block">直接回覆該封信件告知我們即可。</span>
        </p>
        <button
          onClick={resetAll}
          className="px-8 py-3 bg-stone-700 hover:bg-stone-600 text-stone-100 font-bold rounded-xl transition-colors"
        >
          再訂購一筆
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
      {/* ---------- 左：填寫區 ---------- */}
      <div id="order-form-fields" className="lg:col-span-7 space-y-6">
        {/* 規格數量 */}
        <div id="order-specs" className="bg-stone-800 rounded-2xl border border-white/10 p-5 sm:p-6 shadow-lg">
          <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
            <ClipboardList size={20} className="text-amber-400" /> 選擇規格與數量
          </h3>
          <p className="text-stone-400 text-xs mb-5">
            每包 1 公斤，均一價 {currency(PRICE_PER_KG)}／公斤，可混搭不同規格
          </p>

          <div className="space-y-3">
            {SPECS.map((spec) => (
              <div
                key={spec.id}
                className={`flex items-center justify-between gap-2 sm:gap-3 p-3 sm:p-3.5 rounded-xl border transition-colors ${
                  quantities[spec.id] > 0
                    ? 'border-amber-400/60 bg-amber-500/10'
                    : 'border-white/10 bg-stone-900/60'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-stone-800 text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0">
                      規格 {spec.id}
                    </span>
                    <span className="text-white font-bold text-sm sm:text-base">{spec.name}</span>
                  </div>
                  <p className="text-stone-400 text-xs mt-0.5">
                    <span className="inline-block">{spec.detail}・</span><span className="inline-block">{spec.hint}</span>
                  </p>
                </div>
                <Stepper
                  label={`規格 ${spec.id} 數量`}
                  value={quantities[spec.id]}
                  onChange={(n) => setQty(spec.id, n)}
                />
              </div>
            ))}
          </div>

          {errors.packs && (
            <p className="text-red-400 text-xs mt-3 flex items-center gap-1">
              <AlertTriangle size={12} /> {errors.packs}
            </p>
          )}

          {/* 包裝方式 */}
          <div className="mt-5 pt-5 border-t border-white/10">
            <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base mb-3">
              <Gift size={18} className="text-amber-400" /> 包裝方式
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => choosePackaging('self')}
                aria-pressed={packaging === 'self'}
                className={`text-left p-3.5 rounded-xl border transition-colors ${
                  packaging === 'self'
                    ? 'border-green-400/60 bg-green-500/10'
                    : 'border-white/10 bg-stone-900/60 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                  <Leaf size={15} className="text-green-400" /> 自用
                </div>
                <p className="text-stone-400 text-xs mt-1 leading-relaxed">
                  真空包裝直送，不附禮盒。少用一份包裝材，謝謝您一起節約資源，愛地球。
                </p>
              </button>

              <button
                type="button"
                onClick={() => choosePackaging('gift')}
                aria-pressed={packaging === 'gift'}
                className={`text-left p-3.5 rounded-xl border transition-colors ${
                  packaging === 'gift'
                    ? 'border-amber-400/60 bg-amber-500/10'
                    : 'border-white/10 bg-stone-900/60 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                  <Gift size={15} className="text-amber-400" /> 送禮
                </div>
                <p className="text-stone-400 text-xs mt-1 leading-relaxed">
                  免費附贈禮盒，送禮更體面。
                </p>
              </button>
            </div>

            {packaging === 'gift' && (
              <div className="mt-4 bg-stone-900/60 rounded-xl border border-white/10 p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-white font-bold text-sm">需要幾個禮盒？</div>
                    {totals.packs > 0 ? (
                      <p className="text-xs mt-0.5">
                        <span className="text-green-400">免費 {totals.freeBoxes} 個</span>
                        {totals.extraBoxes > 0 && (
                          <span className="text-amber-300">
                            ，加購 {totals.extraBoxes} 個 {currency(totals.giftTotal)}
                          </span>
                        )}
                        <span className="text-stone-500">　最多 {totals.maxBoxes} 個</span>
                      </p>
                    ) : (
                      <p className="text-stone-400 text-xs mt-0.5">請先選擇商品數量</p>
                    )}
                  </div>
                  <Stepper
                    label="禮盒數量"
                    value={giftBoxes}
                    onChange={chooseGiftBoxes}
                    min={totals.packs > 0 ? 1 : 0}
                    max={totals.maxBoxes}
                  />
                </div>

                {boxAdjusted && (
                  <p className="text-amber-300 text-xs mt-2.5 flex items-start gap-1.5">
                    <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                    商品數量減少，禮盒數量已調整為 {totals.maxBoxes} 個，請確認是否需要重新選擇。
                  </p>
                )}

                <div className="text-stone-400 text-xs mt-2.5 leading-relaxed space-y-1.5">
                  <p>
                    每條鰻魚都是單獨真空包裝，一個禮盒約可裝 {GIFT_BOX_CAPACITY}
                    （大條魚約 3 條、小條魚約 4 條），請依要分送的對象人數選擇。
                  </p>
                  <p>
                    <strong className="text-green-400">免費額度為購買公斤數</strong>
                    （買 2 公斤即免費附 2 個）；需要更多可加購，
                    每個 {currency(GIFT_BOX_PRICE)}。
                  </p>
                  <p className="text-amber-300/90">
                    禮盒會分開包裝、{delivery === 'pickup' ? '取貨時一併交給您' : '隨箱一起寄出'}，<strong className="text-amber-200">不會預先把鰻魚裝進去</strong>——
                    紙盒與冷凍品放在一起容易受潮變軟。請您收到後冷凍保存，要送禮前再自行裝盒。
                  </p>
                  <p>禮盒與商品寄至同一個地址；需分別寄給不同收件人請分開下單。</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 優惠碼 */}
        <div className={`bg-stone-800 rounded-2xl border border-white/10 p-5 sm:p-6 shadow-lg ${configured ? '' : 'hidden'}`}>
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Ticket size={20} className="text-amber-400" /> 優惠碼
          </h3>
          <div className="flex gap-2">
            <input
              id="of-promo"
              aria-label="優惠碼"
              className={`${inputClass} flex-1 tracking-wider`}
              value={promoInput}
              onChange={(e) => onPromoInputChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); verifyPromo(); } }}
              placeholder="輸入優惠碼"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={verifyPromo}
              disabled={!promoInput.trim() || promoState === 'checking' || promoState === 'ok'}
              className="px-6 bg-stone-700 hover:bg-stone-600 text-stone-100 font-bold rounded-xl transition-colors disabled:opacity-40 disabled:hover:bg-stone-700 flex items-center gap-2"
            >
              {promoState === 'checking'
                ? <><Loader2 size={16} className="animate-spin" /> 驗證中</>
                : promoState === 'ok' ? '已套用' : '套用'}
            </button>
          </div>

          {promoState === 'ok' && (
            <p className="text-green-400 text-sm mt-3 flex items-center gap-1.5">
              <CheckCircle size={14} />
              {totals.discount > 0
                ? <>優惠碼已套用，本筆折抵 <strong>{currency(totals.discount)}</strong></>
                : <>優惠碼有效，選購商品後即可折抵</>}
            </p>
          )}
          {promoState === 'bad' && (
            <p className="text-red-400 text-sm mt-3 flex items-center gap-1.5">
              <AlertTriangle size={14} /> 優惠碼不正確，請確認後再試一次
            </p>
          )}
        </div>

        {/* 收件資料 */}
        <div className={`bg-stone-800 rounded-2xl border border-white/10 p-5 sm:p-6 space-y-4 shadow-lg ${configured ? '' : 'hidden'}`}>
          <h3 className="text-white font-bold text-lg mb-1">收件資料</h3>

          {/* 取貨方式 */}
          <div>
            <div className="text-sm font-bold text-stone-200 mb-2">取貨方式</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => chooseDelivery('ship')}
                aria-pressed={delivery === 'ship'}
                className={`text-left p-3.5 rounded-xl border transition-colors ${
                  delivery === 'ship'
                    ? 'border-amber-400/60 bg-amber-500/10'
                    : 'border-white/10 bg-stone-900/60 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                  <Truck size={15} className="text-amber-400" /> 黑貓冷凍宅配
                </div>
                <p className="text-stone-400 text-xs mt-1 leading-relaxed">
                  全程低溫配送到府，運費依公斤數計算，滿 {FREE_SHIPPING_PACKS} 公斤免運。
                </p>
              </button>
              <button
                type="button"
                onClick={() => chooseDelivery('pickup')}
                aria-pressed={delivery === 'pickup'}
                className={`text-left p-3.5 rounded-xl border transition-colors ${
                  delivery === 'pickup'
                    ? 'border-green-400/60 bg-green-500/10'
                    : 'border-white/10 bg-stone-900/60 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                  <MapPin size={15} className="text-green-400" /> 自取／面交
                </div>
                <p className="text-stone-400 text-xs mt-1 leading-relaxed">
                  到養鰻場自取或約定面交，免運費；時間地點由專人與您聯繫確認。
                </p>
              </button>
            </div>
          </div>

          <Field id="of-name" label="收件人姓名" required error={errors.name}>
            <input id="of-name" aria-invalid={!!errors.name} className={inputClass} value={name}
              onChange={(e) => setName(e.target.value)} placeholder="王小明" autoComplete="name" />
          </Field>

          <Field id="of-phone" label="聯絡電話" required error={errors.phone}>
            <input id="of-phone" aria-invalid={!!errors.phone} className={inputClass} value={phone} type="tel"
              onChange={(e) => setPhone(e.target.value)} placeholder="0912-345-678" autoComplete="tel" />
          </Field>

          {delivery === 'ship' ? (
            <Field id="of-address" label="收件地址" required error={errors.address}
              hint="黑貓冷凍宅配，請填寫完整地址">
              <input id="of-address" aria-invalid={!!errors.address} className={inputClass} value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="臺南市 710 永康區○○路○○巷 100 號" autoComplete="street-address" />
            </Field>
          ) : (
            <Field id="of-pickup" label="自取／面交說明" hint="選填，例如希望的日期時段或面交地點">
              <input id="of-pickup" className={inputClass} value={pickupNote}
                onChange={(e) => setPickupNote(e.target.value)}
                placeholder="希望週六下午到養鰻場自取" autoComplete="off" />
            </Field>
          )}

          <Field id="of-email" label="Email" required hint="確認信與匯款帳號會寄到這裡，請確認填寫正確" error={errors.email}>
            <input id="of-email" aria-invalid={!!errors.email} className={inputClass} value={email} type="email"
              onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" autoComplete="email" />
          </Field>

          <Field id="of-note" label="備註" hint="選填，例如希望的配送時段、發票抬頭">
            <textarea id="of-note" className={`${inputClass} min-h-[90px] resize-y`} value={note}
              onChange={(e) => setNote(e.target.value)} placeholder="白天無人收件，請晚上配送" />
          </Field>

          {/* honeypot：以 CSS 隱藏，機器人才會填 */}
          <div className="absolute w-px h-px overflow-hidden -left-[9999px]" aria-hidden="true">
            <label htmlFor="of-company">公司名稱</label>
            <input id="of-company" tabIndex={-1} autoComplete="off" value={company}
              onChange={(e) => setCompany(e.target.value)} />
          </div>
        </div>

        {/* 付款方式 */}
        <div className={`bg-stone-800 rounded-2xl border border-white/10 p-5 sm:p-6 shadow-lg ${configured ? '' : 'hidden'}`}>
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Wallet size={20} className="text-amber-400" /> 付款方式
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPayment('transfer')}
              aria-pressed={payment === 'transfer'}
              className={`text-left p-3.5 rounded-xl border transition-colors ${
                payment === 'transfer'
                  ? 'border-amber-400/60 bg-amber-500/10'
                  : 'border-white/10 bg-stone-900/60 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                <Landmark size={15} className="text-amber-400" /> 銀行轉帳
              </div>
              <p className="text-stone-400 text-xs mt-1 leading-relaxed">
                ATM 或網路銀行。匯款帳號會寄到您的 Email，請於 {PAYMENT_DEADLINE_HOURS} 小時內完成匯款。
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPayment('linepay')}
              aria-pressed={payment === 'linepay'}
              className={`text-left p-3.5 rounded-xl border transition-colors ${
                payment === 'linepay'
                  ? 'border-green-400/60 bg-green-500/10'
                  : 'border-white/10 bg-stone-900/60 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                <Smartphone size={15} className="text-green-400" /> LINE Pay
              </div>
              <p className="text-stone-400 text-xs mt-1 leading-relaxed">
                賣家的 LINE ID 會寄到您的 Email，加好友後以 LINE Pay 轉帳，請於 {PAYMENT_DEADLINE_HOURS} 小時內完成。
              </p>
            </button>

            <button
              type="button"
              onClick={() => { if (delivery === 'pickup') setPayment('cash'); }}
              disabled={delivery !== 'pickup'}
              aria-pressed={payment === 'cash'}
              className={`text-left p-3.5 rounded-xl border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                payment === 'cash'
                  ? 'border-green-400/60 bg-green-500/10'
                  : 'border-white/10 bg-stone-900/60 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                <Banknote size={15} className="text-green-400" /> 取貨時付現
              </div>
              <p className="text-stone-400 text-xs mt-1 leading-relaxed">
                {delivery === 'pickup'
                  ? '自取或面交時當面付款。'
                  : '僅限選擇「自取／面交」的訂單。'}
              </p>
            </button>
          </div>

          {payment === 'transfer' && (
            <div className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="of-payer" label="匯款人姓名" hint="選填">
                <input id="of-payer" className={inputClass} value={payerName} maxLength={30}
                  onChange={(e) => setPayerName(e.target.value)} placeholder="王小明" autoComplete="off" />
              </Field>
              <Field id="of-last5" label="匯款帳號後五碼" hint="選填" error={errors.last5}>
                <input id="of-last5" aria-invalid={!!errors.last5} className={`${inputClass} tracking-[0.3em]`} value={last5}
                  onChange={(e) => setLast5(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                  inputMode="numeric" maxLength={5} placeholder="12345" autoComplete="off" />
              </Field>
              </div>
              <p className="text-stone-400 text-xs mt-2 leading-relaxed">
                用來核對入帳。還不確定用哪個帳戶轉帳的話，可以先留空，轉帳後回覆確認信告知即可。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ---------- 右：訂單摘要 ---------- */}
      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-24 space-y-4">
          <div ref={summaryRef} className="bg-gradient-to-b from-stone-800 to-stone-900 rounded-2xl border border-amber-500/40 p-5 sm:p-6 shadow-xl">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <ShoppingBag size={20} className="text-amber-400" /> 訂單摘要
            </h3>

            <div className="space-y-2.5 text-sm">
              {SPECS.filter((s) => quantities[s.id] > 0).map((s) => (
                <div key={s.id} className="flex justify-between items-baseline text-stone-300">
                  <span>
                    規格 {s.id}・{s.name}
                    <span className="text-stone-500"> × {quantities[s.id]}</span>
                  </span>
                  <span className="font-bold text-white whitespace-nowrap">
                    {currency(quantities[s.id] * PRICE_PER_KG)}
                  </span>
                </div>
              ))}

              {totals.giftBoxes > 0 && (
                <div className="flex justify-between items-baseline text-stone-300">
                  <span>
                    送禮禮盒<span className="text-stone-500"> × {totals.giftBoxes}</span>
                    {totals.extraBoxes > 0 && (
                      <span className="text-stone-500 text-xs">（免費 {totals.freeBoxes}＋加購 {totals.extraBoxes}）</span>
                    )}
                  </span>
                  <span className="font-bold whitespace-nowrap">
                    {totals.giftTotal > 0
                      ? <span className="text-white">{currency(totals.giftTotal)}</span>
                      : <span className="text-green-400">免費</span>}
                  </span>
                </div>
              )}

              {totals.packs === 0 && (
                <p className="text-stone-400 text-sm py-3 text-center">尚未選擇商品</p>
              )}

              <div className="flex justify-between items-baseline text-stone-300 pt-2.5 border-t border-white/10">
                <span className="flex items-center gap-1.5">
                  <Truck size={15} className="text-amber-400" /> 運費
                  <span className="text-stone-500 text-xs">
                    {delivery === 'pickup' ? '（自取／面交）' : `（共 ${totals.packs} 公斤）`}
                  </span>
                </span>
                <span className="font-bold whitespace-nowrap">
                  {totals.packs > 0 && totals.shipping === 0
                    ? <span className="text-green-400">免運費</span>
                    : <span className="text-white">{currency(totals.shipping)}</span>}
                </span>
              </div>

              {totals.discount > 0 && (
                <div className="flex justify-between items-baseline text-green-400">
                  <span className="flex items-center gap-1.5">
                    <Ticket size={15} /> 優惠碼折抵
                  </span>
                  <span className="font-bold whitespace-nowrap">−{currency(totals.discount)}</span>
                </div>
              )}
            </div>

            {totals.packsToFreeShipping > 0 && (
              <div className="mt-4 bg-green-950/40 border border-green-500/30 rounded-xl px-3.5 py-2.5 text-green-300 text-xs leading-relaxed">
                🎉 再加購 <strong className="text-green-200">{totals.packsToFreeShipping} 公斤</strong> 即享全臺免運費，揪團合購最划算！
              </div>
            )}

            <div className="flex justify-between items-baseline mt-5 pt-4 border-t border-amber-500/30">
              <span className="text-stone-200 font-bold">應付總金額</span>
              <span className="text-3xl sm:text-4xl font-extrabold text-amber-400">
                {currency(totals.total)}
              </span>
            </div>

            {configured ? (
              <>
                <button
                  type="button"
                  onClick={handleReview}
                  disabled={step === 'sending'}
                  className="w-full mt-5 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  確認訂單內容 <ShoppingBag size={20} />
                </button>
                {Object.keys(errors).length > 0 && (
                  <p role="alert" className="text-red-400 text-xs mt-2.5 flex items-center justify-center gap-1">
                    <AlertTriangle size={12} /> 還有欄位需要填寫或修正，請看標示紅字的地方
                  </p>
                )}
                <p className="text-stone-400 text-[11px] leading-relaxed mt-3 text-center">
                  {payment === 'transfer'
                    ? `匯款帳號會寄到您的 Email，請於 ${PAYMENT_DEADLINE_HOURS} 小時內完成匯款，確認入帳後安排出貨。`
                    : payment === 'linepay'
                      ? `賣家的 LINE ID 會寄到您的 Email，請於 ${PAYMENT_DEADLINE_HOURS} 小時內以 LINE Pay 完成付款，確認收款後安排出貨。`
                      : '請於自取或面交時付現，我們會與您聯繫約定時間地點。'}
                </p>
              </>
            ) : (
              <>
                <a
                  href={FALLBACK_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mt-5 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  前往填寫訂購單 <ExternalLink size={19} />
                </a>
                <p className="text-stone-400 text-[11px] leading-relaxed mt-3 text-center">
                  以上為金額試算，實際下單請於訂購單中填寫，我們收到後將盡快與您聯繫。
                </p>
              </>
            )}
          </div>

          {/* 運費說明 */}
          <div className="bg-stone-800 rounded-2xl border border-white/10 p-5 shadow-lg">
            <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
              <Truck size={16} className="text-amber-400" /> 黑貓冷凍宅配運費
            </h4>
            <ul className="space-y-1.5 text-xs text-stone-300">
              {SHIPPING_TIERS.map((t) => (
                <li key={t.label} className="flex justify-between gap-3">
                  <span>{t.label}（{t.packs}）</span>
                  <span className={`font-bold whitespace-nowrap ${t.fee === 0 ? 'text-green-400' : 'text-amber-300'}`}>
                    {t.fee === 0 ? '免運費' : currency(t.fee)}
                  </span>
                </li>
              ))}
              <li className="flex justify-between gap-3 pt-1.5 border-t border-white/10">
                <span>自取／面交</span>
                <span className="font-bold whitespace-nowrap text-green-400">免運費</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ---------- 手機版底部浮動列 ---------- */}
      {configured && step === 'form' && totals.packs > 0 && summaryBelow && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-stone-900/95 backdrop-blur-md border-t border-amber-500/30 shadow-[0_-4px_24px_rgba(0,0,0,0.55)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-stone-400 text-[11px] leading-tight">
                共 {totals.packs} 公斤
                {totals.discount > 0 && (
                  <span className="text-green-400">・已折 {currency(totals.discount)}</span>
                )}
              </div>
              <div className="text-amber-400 font-extrabold text-2xl leading-tight">
                {currency(totals.total)}
              </div>
            </div>
            <button
              type="button"
              onClick={goToSummary}
              className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold rounded-xl shadow-lg transition-all flex items-center gap-1"
            >
              前往訂購 <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ---------- 確認 / 送出 / 失敗 對話框 ---------- */}
      {(step === 'confirm' || step === 'sending' || step === 'error') && (
        <div
          className="fixed inset-0 z-[60] bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-confirm-title"
        >
          <div className="bg-stone-800 rounded-3xl border border-amber-500/40 shadow-2xl w-full max-w-lg my-8">
            {step === 'error' ? (
              <div className="p-7 sm:p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                  <AlertTriangle size={34} />
                </div>
                <h3 className="text-xl font-extrabold text-white mb-2">訂單送出失敗</h3>
                <p className="text-stone-400 text-sm leading-relaxed mb-1">
                  很抱歉，系統暫時無法接收訂單（{errorMsg}）。
                </p>
                <p className="text-stone-400 text-sm leading-relaxed mb-6">
                  您的資料還在，可以再試一次；或改用下方的備援訂購單，我們一樣收得到。
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={handleSubmit}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl transition-colors">
                    再試一次
                  </button>
                  <a href={FALLBACK_FORM_URL} target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-3 bg-stone-700 hover:bg-stone-600 text-stone-100 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                    改用備援訂購單 <ExternalLink size={15} />
                  </a>
                </div>
                <button onClick={() => setStep('form')}
                  className="mt-4 text-stone-500 hover:text-stone-300 text-sm transition-colors">
                  返回修改訂單
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-6 sm:px-7 py-5 border-b border-white/10">
                  <h3 id="order-confirm-title" className="text-lg font-extrabold text-white">
                    請確認訂單內容
                  </h3>
                  <button onClick={() => setStep('form')} disabled={step === 'sending'}
                    aria-label="關閉" className="text-stone-500 hover:text-white transition-colors disabled:opacity-30">
                    <X size={22} />
                  </button>
                </div>

                <div className="px-6 sm:px-7 py-5 space-y-4 text-sm">
                  <div className="space-y-2">
                    {SPECS.filter((s) => quantities[s.id] > 0).map((s) => (
                      <div key={s.id} className="flex justify-between text-stone-300">
                        <span>規格 {s.id}・{s.name} × {quantities[s.id]}</span>
                        <span className="text-white font-bold">{currency(quantities[s.id] * PRICE_PER_KG)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-stone-300">
                      <span>包裝方式</span>
                      <span className="font-bold text-white">{packaging === 'gift' ? '送禮' : '自用'}</span>
                    </div>
                    {totals.giftBoxes > 0 && (
                      <div className="flex justify-between text-stone-300">
                        <span>
                          送禮禮盒 × {totals.giftBoxes}
                          {totals.extraBoxes > 0 && (
                            <span className="text-stone-500 text-xs">（免費 {totals.freeBoxes}＋加購 {totals.extraBoxes}）</span>
                          )}
                        </span>
                        <span className="font-bold">
                          {totals.giftTotal > 0
                            ? <span className="text-white">{currency(totals.giftTotal)}</span>
                            : <span className="text-green-400">免費附贈</span>}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-stone-300 pt-2 border-t border-white/10">
                      <span>{delivery === 'pickup' ? '運費（自取／面交）' : `運費（${totals.packs} 公斤）`}</span>
                      <span className="font-bold">
                        {totals.shipping === 0 ? <span className="text-green-400">免運費</span> : currency(totals.shipping)}
                      </span>
                    </div>
                    {totals.discount > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>優惠碼折抵（{appliedCode}）</span>
                        <span className="font-bold">−{currency(totals.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-baseline pt-2.5 border-t border-amber-500/30">
                      <span className="text-white font-bold">應付總金額</span>
                      <span className="text-2xl font-extrabold text-amber-400">{currency(totals.total)}</span>
                    </div>
                  </div>

                  <dl className="bg-stone-900 rounded-xl p-4 space-y-2 text-stone-300 border border-white/10">
                    <div className="flex gap-3"><dt className="text-stone-500 w-16 flex-shrink-0">姓名</dt><dd>{name}</dd></div>
                    <div className="flex gap-3"><dt className="text-stone-500 w-16 flex-shrink-0">電話</dt><dd>{phone}</dd></div>
                    <div className="flex gap-3"><dt className="text-stone-500 w-16 flex-shrink-0">取貨</dt><dd>{delivery === 'pickup' ? '自取／面交（免運費）' : '黑貓冷凍宅配'}</dd></div>
                    {delivery === 'ship'
                      ? <div className="flex gap-3"><dt className="text-stone-500 w-16 flex-shrink-0">地址</dt><dd className="break-words">{address}</dd></div>
                      : pickupNote.trim() && <div className="flex gap-3"><dt className="text-stone-500 w-16 flex-shrink-0">說明</dt><dd className="break-words">{pickupNote}</dd></div>}
                    <div className="flex gap-3"><dt className="text-stone-500 w-16 flex-shrink-0">付款</dt><dd>{payment === 'cash' ? '取貨時付現' : payment === 'linepay' ? 'LINE Pay' : '銀行轉帳'}{payment === 'transfer' && payerLabel && `（${payerLabel}）`}</dd></div>
                    {email && <div className="flex gap-3"><dt className="text-stone-500 w-16 flex-shrink-0">Email</dt><dd className="break-all">{email}</dd></div>}
                    {note && <div className="flex gap-3"><dt className="text-stone-500 w-16 flex-shrink-0">備註</dt><dd className="whitespace-pre-line break-words">{note}</dd></div>}
                  </dl>
                </div>

                <div className="px-6 sm:px-7 pb-6 flex flex-col sm:flex-row gap-3">
                  <button onClick={() => setStep('form')} disabled={step === 'sending'}
                    className="sm:w-auto px-6 py-3.5 bg-stone-700 hover:bg-stone-600 text-stone-200 font-bold rounded-xl transition-colors disabled:opacity-40">
                    返回修改
                  </button>
                  <button onClick={handleSubmit} disabled={step === 'sending'}
                    className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                    {step === 'sending'
                      ? <><Loader2 size={18} className="animate-spin" /> 送出中…</>
                      : <>確認送出訂單 <CheckCircle2 size={18} /></>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderForm;
