import React, { useMemo, useState } from 'react';
import {
  Minus, Plus, Gift, Truck, ShoppingBag, CheckCircle2, AlertTriangle,
  Loader2, X, ExternalLink, ClipboardList,
} from 'lucide-react';
import {
  SPECS, PRICE_PER_KG, GIFT_BOX_PRICE, SHIPPING_TIERS, FREE_SHIPPING_PACKS,
  calcOrder, currency, type Quantities, type SpecId,
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
      className="w-9 h-9 rounded-lg flex items-center justify-center text-stone-300 hover:bg-stone-700 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
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
      className="w-12 bg-transparent text-center text-lg font-bold text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
    <button
      type="button"
      aria-label={`增加${label}`}
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      className="w-9 h-9 rounded-lg flex items-center justify-center text-stone-300 hover:bg-amber-600 hover:text-stone-950 disabled:opacity-30 transition-colors"
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
  'w-full bg-stone-900 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-stone-500 outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/40 transition-colors';

const OrderForm = ({ quantities, setQuantities }: Props) => {
  const [giftBoxes, setGiftBoxes] = useState(0);
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

  const totals = useMemo(() => calcOrder(quantities, giftBoxes), [quantities, giftBoxes]);

  /**
   * 還沒設定 Apps Script 網址時（例如剛部署、環境變數尚未填），
   * 不讓顧客白填一輪再失敗：改為只保留金額試算，並導向備援訂購單。
   */
  const configured = Boolean(ORDER_API_URL);

  const setQty = (id: SpecId, n: number) =>
    setQuantities((prev) => ({ ...prev, [id]: n }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (totals.packs < 1) next.packs = '請至少選擇 1 公斤的商品';
    if (!name.trim()) next.name = '請填寫收件人姓名';
    if (!phone.trim()) next.phone = '請填寫聯絡電話';
    else if (!/^[\d\-+()\s]{8,20}$/.test(phone.trim())) next.phone = '電話格式看起來不正確';
    if (!address.trim()) next.address = '請填寫收貨地址';
    // 自取／面交不需要地址，長度檢查要放行
    else if (!/自取|面交/.test(address) && address.trim().length < 8)
      next.address = '請填寫完整地址（含縣市與門牌號碼）；自取或面交請直接填「自取」或「面交」';
    if (!email.trim()) next.email = '請填寫 Email，我們會寄送訂單確認信給您核對';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = 'Email 格式看起來不正確';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleReview = () => {
    if (validate()) setStep('confirm');
    else document.getElementById('order-form-fields')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
          address: address.trim(),
          email: email.trim(),
          note: note.trim(),
          quantities,
          giftBoxes,
          company, // honeypot
        }),
      });

      const data = await res.json();
      if (!data || !data.ok) throw new Error(data?.message || '訂單未能成立');

      setOrderNo(data.orderNo || '');
      setStep('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '未知錯誤');
      setStep('error');
    }
  };

  const resetAll = () => {
    setQuantities({ A: 0, B: 0, C: 0 });
    setGiftBoxes(0);
    setName(''); setPhone(''); setAddress(''); setEmail(''); setNote('');
    setErrors({});
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
        <p className="text-stone-400 text-sm sm:text-base leading-relaxed max-w-md mx-auto mb-8">
          訂單確認信已寄至您填寫的 Email，請收信核對訂購內容；
          若有任何需要更正的地方，直接回覆該封信件告知我們即可。
          我們也會盡快由專人與您聯繫確認付款方式與出貨時間。
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
        <div className="bg-stone-800 rounded-2xl border border-white/10 p-5 sm:p-6 shadow-lg">
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
                className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-colors ${
                  quantities[spec.id] > 0
                    ? 'border-amber-400/60 bg-amber-500/10'
                    : 'border-white/10 bg-stone-900/60'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-stone-800 text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded">
                      規格 {spec.id}
                    </span>
                    <span className="text-white font-bold text-sm sm:text-base truncate">{spec.name}</span>
                  </div>
                  <p className="text-stone-400 text-xs mt-0.5">
                    {spec.detail}・{spec.hint}
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

          {/* 禮盒 */}
          <div className="flex items-center justify-between gap-3 mt-5 pt-5 border-t border-white/10">
            <div>
              <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                <Gift size={18} className="text-amber-400" /> 送禮禮盒
              </div>
              <p className="text-stone-400 text-xs mt-0.5">
                每個 {currency(GIFT_BOX_PRICE)}，一盒可裝 3~4 片，送禮更體面
              </p>
            </div>
            <Stepper label="禮盒數量" value={giftBoxes} onChange={setGiftBoxes} />
          </div>
        </div>

        {/* 收件資料 */}
        <div className={`bg-stone-800 rounded-2xl border border-white/10 p-5 sm:p-6 space-y-4 shadow-lg ${configured ? '' : 'hidden'}`}>
          <h3 className="text-white font-bold text-lg mb-1">收件資料</h3>

          <Field id="of-name" label="收件人姓名" required error={errors.name}>
            <input id="of-name" className={inputClass} value={name}
              onChange={(e) => setName(e.target.value)} placeholder="王小明" autoComplete="name" />
          </Field>

          <Field id="of-phone" label="聯絡電話" required error={errors.phone}>
            <input id="of-phone" className={inputClass} value={phone} type="tel"
              onChange={(e) => setPhone(e.target.value)} placeholder="0912-345-678" autoComplete="tel" />
          </Field>

          <Field id="of-address" label="收貨地址" required error={errors.address}
            hint="黑貓冷凍宅配；自取或面交請直接填「自取」或「面交」">
            <input id="of-address" className={inputClass} value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="臺南市 710 永康區○○路○○巷 100 號" autoComplete="street-address" />
          </Field>

          <Field id="of-email" label="Email" required hint="訂單確認信會寄到這裡，請確認填寫正確" error={errors.email}>
            <input id="of-email" className={inputClass} value={email} type="email"
              onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" autoComplete="email" />
          </Field>

          <Field id="of-note" label="備註" hint="選填，例如指定到貨日、發票抬頭">
            <textarea id="of-note" className={`${inputClass} min-h-[90px] resize-y`} value={note}
              onChange={(e) => setNote(e.target.value)} placeholder="希望中秋節前收到" />
          </Field>

          {/* honeypot：以 CSS 隱藏，機器人才會填 */}
          <div className="absolute w-px h-px overflow-hidden -left-[9999px]" aria-hidden="true">
            <label htmlFor="of-company">公司名稱</label>
            <input id="of-company" tabIndex={-1} autoComplete="off" value={company}
              onChange={(e) => setCompany(e.target.value)} />
          </div>
        </div>
      </div>

      {/* ---------- 右：訂單摘要 ---------- */}
      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-24 space-y-4">
          <div className="bg-gradient-to-b from-stone-800 to-stone-900 rounded-2xl border border-amber-500/40 p-5 sm:p-6 shadow-xl">
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

              {giftBoxes > 0 && (
                <div className="flex justify-between items-baseline text-stone-300">
                  <span>送禮禮盒<span className="text-stone-500"> × {giftBoxes}</span></span>
                  <span className="font-bold text-white whitespace-nowrap">{currency(totals.giftTotal)}</span>
                </div>
              )}

              {totals.packs === 0 && (
                <p className="text-stone-400 text-sm py-3 text-center">尚未選擇商品</p>
              )}

              <div className="flex justify-between items-baseline text-stone-300 pt-2.5 border-t border-white/10">
                <span className="flex items-center gap-1.5">
                  <Truck size={15} className="text-amber-400" /> 運費
                  <span className="text-stone-500 text-xs">（共 {totals.packs} 公斤）</span>
                </span>
                <span className="font-bold whitespace-nowrap">
                  {totals.packs >= FREE_SHIPPING_PACKS
                    ? <span className="text-green-400">免運費</span>
                    : <span className="text-white">{currency(totals.shipping)}</span>}
                </span>
              </div>
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
                <p className="text-stone-400 text-[11px] leading-relaxed mt-3 text-center">
                  送出後將由專人與您聯繫確認付款方式與出貨時間，現階段不需線上付款。
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
                  <span>{t.label}</span>
                  <span className={`font-bold whitespace-nowrap ${t.fee === 0 ? 'text-green-400' : 'text-amber-300'}`}>
                    {t.fee === 0 ? '免運費' : currency(t.fee)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

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
                    {giftBoxes > 0 && (
                      <div className="flex justify-between text-stone-300">
                        <span>送禮禮盒 × {giftBoxes}</span>
                        <span className="text-white font-bold">{currency(totals.giftTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-stone-300 pt-2 border-t border-white/10">
                      <span>運費（{totals.packs} 公斤）</span>
                      <span className="font-bold">
                        {totals.shipping === 0 ? <span className="text-green-400">免運費</span> : currency(totals.shipping)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2.5 border-t border-amber-500/30">
                      <span className="text-white font-bold">應付總金額</span>
                      <span className="text-2xl font-extrabold text-amber-400">{currency(totals.total)}</span>
                    </div>
                  </div>

                  <dl className="bg-stone-900 rounded-xl p-4 space-y-2 text-stone-300 border border-white/10">
                    <div className="flex gap-3"><dt className="text-stone-500 w-16 flex-shrink-0">姓名</dt><dd>{name}</dd></div>
                    <div className="flex gap-3"><dt className="text-stone-500 w-16 flex-shrink-0">電話</dt><dd>{phone}</dd></div>
                    <div className="flex gap-3"><dt className="text-stone-500 w-16 flex-shrink-0">地址</dt><dd className="break-words">{address}</dd></div>
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
