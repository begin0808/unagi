import React, { useEffect, useMemo, useState } from 'react';
import {
  ShoppingBag, CheckCircle2, AlertTriangle, Loader2, X, ExternalLink,
  Gift, Leaf, ClipboardList, Banknote, MapPin,
} from 'lucide-react';
import {
  SPECS, PRICE_PER_KG, GIFT_BOX_CAPACITY, GIFT_BOX_PRICE, NDA_PICKUP_LABEL,
  calcOrder, currency,
  type Quantities, type SpecId, type Packaging,
} from '../lib/pricing';
import { ORDER_API_URL, FALLBACK_FORM_URL } from '../lib/orderApi';
import { Stepper, Field, inputClass } from './FormParts';

type Step = 'form' | 'confirm' | 'sending' | 'done' | 'error';

interface Props {
  quantities: Quantities;
  setQuantities: React.Dispatch<React.SetStateAction<Quantities>>;
}

/** 必填欄位由上到下的順序（錯誤代號 → 要跳過去的元素 id） */
const FIELD_ORDER: [string, string][] = [
  ['packs', 'nda-specs'],
  ['name', 'nda-name'],
  ['email', 'nda-email'],
];

/**
 * 南大附中合作社專屬訂購表單。
 *
 * 與主訂購表單的差別：取貨與付款方式固定（合作社取貨、取貨時付款、免運費），
 * 只問姓名與 Email（訂單確認信要寄過去），不要電話與地址，也沒有優惠碼。
 * 後端會依 channel: 'nda' 再次強制這些規則，不採信瀏覽器送來的值。
 */
const NdaOrderForm = ({ quantities, setQuantities }: Props) => {
  const [packaging, setPackaging] = useState<Packaging>('self');
  const [giftBoxes, setGiftBoxes] = useState(1);
  // 包數變少導致禮盒超過上限時，自動下修並提示
  const [boxAdjusted, setBoxAdjusted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [company, setCompany] = useState(''); // honeypot：真人看不到也不會填
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<Step>('form');
  const [orderNo, setOrderNo] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [finalTotal, setFinalTotal] = useState(0);
  const [triedReview, setTriedReview] = useState(false);

  // 合作社取貨一律免運費
  const totals = useMemo(
    () => calcOrder(quantities, packaging, giftBoxes, 0, 'pickup'),
    [quantities, packaging, giftBoxes],
  );

  useEffect(() => {
    if (packaging !== 'gift') return;
    if (giftBoxes > totals.maxBoxes) {
      setGiftBoxes(totals.maxBoxes);
      setBoxAdjusted(true);
    }
  }, [totals.maxBoxes, packaging, giftBoxes]);

  const setQty = (id: SpecId, n: number) =>
    setQuantities((prev) => ({ ...prev, [id]: n }));

  const choosePackaging = (v: Packaging) => {
    setPackaging(v);
    setBoxAdjusted(false);
    if (v === 'gift' && giftBoxes < 1) setGiftBoxes(1);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (totals.packs < 1) next.packs = '請至少選擇 1 公斤的商品';
    if (!name.trim()) next.name = '請填寫訂購人姓名，合作社點交時要核對';
    if (!email.trim()) next.email = '請填寫 Email，我們會寄送訂單確認信給您核對';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = 'Email 格式看起來不正確';
    setErrors(next);
    return next;
  };

  // 按過一次「確認訂單內容」之後，邊填邊重新檢查
  useEffect(() => {
    if (triedReview) validate();
  }, [triedReview, name, email, totals.packs]);

  const handleReview = () => {
    setTriedReview(true);
    const errs = validate();
    const first = FIELD_ORDER.find(([key]) => errs[key]);
    if (!first) {
      setStep('confirm');
      return;
    }
    const el = document.getElementById(first[1]);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (el instanceof HTMLInputElement) el.focus({ preventScroll: true });
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
          channel: 'nda',
          name: name.trim(),
          email: email.trim(),
          note: note.trim(),
          quantities,
          packaging,
          giftBoxes: totals.giftBoxes,
          company, // honeypot
        }),
      });

      const data = await res.json();
      if (!data || !data.ok) throw new Error(data?.message || '訂單未能成立');

      setOrderNo(data.orderNo || '');
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
    setName('');
    setEmail('');
    setNote('');
    setErrors({});
    setTriedReview(false);
    setFinalTotal(0);
    setStep('form');
  };

  // ---------- 完成畫面 ----------
  if (step === 'done') {
    return (
      <div className="bg-stone-800 rounded-3xl border border-green-500/40 p-6 sm:p-10 text-center shadow-2xl">
        <div className="w-20 h-20 rounded-full bg-green-500/15 text-green-400 flex items-center justify-center mx-auto mb-5 border border-green-500/30">
          <CheckCircle2 size={44} />
        </div>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">訂單已成功送出！</h3>
        {orderNo && (
          <p className="text-stone-300 mb-2">
            您的訂單編號：<span className="text-amber-400 font-bold tracking-wider">{orderNo}</span>
          </p>
        )}

        <div className="max-w-md mx-auto my-6 text-left bg-stone-900 rounded-2xl border border-green-500/40 p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-green-400 font-bold">
            <Banknote size={18} /> 取貨時付款 {currency(finalTotal)}
          </div>
          <p className="text-stone-200 text-sm leading-relaxed">
            <span className="inline-block">取貨地點：</span>
            <span className="inline-block font-bold text-white">{NDA_PICKUP_LABEL}</span>
          </p>
          <p className="text-stone-400 text-xs leading-relaxed">
            <span className="inline-block">到貨後我們會通知，</span>
            <span className="inline-block">請到合作社取貨並當面付款。</span>
          </p>
        </div>

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
    <div className="space-y-6">
      {/* 規格數量 */}
      <div id="nda-specs" className="bg-stone-800 rounded-2xl border border-white/10 p-5 sm:p-6 shadow-lg">
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
                真空包裝，不附禮盒。少用一份包裝材，謝謝您一起節約資源，愛地球。
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
                  onChange={(v) => { setGiftBoxes(v); setBoxAdjusted(false); }}
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
                  （買 2 公斤即免費附 2 個）；需要更多可加購，每個 {currency(GIFT_BOX_PRICE)}。
                </p>
                <p className="text-amber-300/90">
                  禮盒會分開包裝、取貨時一併交給您，<strong className="text-amber-200">不會預先把鰻魚裝進去</strong>——
                  紙盒與冷凍品放在一起容易受潮變軟。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 訂購人 */}
      <div className="bg-stone-800 rounded-2xl border border-white/10 p-5 sm:p-6 space-y-4 shadow-lg">
        <h3 className="text-white font-bold text-lg mb-1">訂購人</h3>

        <Field id="nda-name" label="姓名" required error={errors.name}>
          <input id="nda-name" aria-invalid={!!errors.name} className={inputClass} value={name}
            onChange={(e) => setName(e.target.value)} placeholder="王小明" autoComplete="name" />
        </Field>

        <Field id="nda-email" label="Email" required hint="訂單確認信會寄到這裡，請確認填寫正確" error={errors.email}>
          <input id="nda-email" aria-invalid={!!errors.email} className={inputClass} value={email} type="email"
            onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" autoComplete="email" />
        </Field>

        <Field id="nda-note" label="備註" hint="選填，例如希望的取貨時間">
          <textarea id="nda-note" className={`${inputClass} min-h-[80px] resize-y`} value={note}
            onChange={(e) => setNote(e.target.value)} placeholder="想在中秋前一週取貨" />
        </Field>

        {/* honeypot：以 CSS 隱藏，機器人才會填 */}
        <div className="absolute w-px h-px overflow-hidden -left-[9999px]" aria-hidden="true">
          <label htmlFor="nda-company">公司名稱</label>
          <input id="nda-company" tabIndex={-1} autoComplete="off" value={company}
            onChange={(e) => setCompany(e.target.value)} />
        </div>
      </div>

      {/* 取貨與付款：固定，不用選 */}
      <div className="bg-stone-800 rounded-2xl border border-white/10 p-5 sm:p-6 shadow-lg">
        <h3 className="text-white font-bold text-lg mb-3">取貨與付款</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl border border-green-400/40 bg-green-500/10">
            <div className="flex items-center gap-1.5 text-white font-bold text-sm">
              <MapPin size={15} className="text-green-400" /> {NDA_PICKUP_LABEL}
            </div>
            <p className="text-stone-400 text-xs mt-1 leading-relaxed">
              到貨後通知您，到合作社取貨，免運費。
            </p>
          </div>
          <div className="p-3.5 rounded-xl border border-green-400/40 bg-green-500/10">
            <div className="flex items-center gap-1.5 text-white font-bold text-sm">
              <Banknote size={15} className="text-green-400" /> 取貨時付款
            </div>
            <p className="text-stone-400 text-xs mt-1 leading-relaxed">
              取貨時在合作社當面付款，不需要先轉帳。
            </p>
          </div>
        </div>
      </div>

      {/* 訂單摘要 */}
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
              <MapPin size={15} className="text-green-400" /> 取貨
              <span className="text-stone-500 text-xs">（{NDA_PICKUP_LABEL}）</span>
            </span>
            <span className="font-bold text-green-400 whitespace-nowrap">免運費</span>
          </div>
        </div>

        <div className="flex justify-between items-baseline mt-5 pt-4 border-t border-amber-500/30">
          <span className="text-stone-200 font-bold">應付總金額</span>
          <span className="text-3xl sm:text-4xl font-extrabold text-amber-400">
            {currency(totals.total)}
          </span>
        </div>

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
            <AlertTriangle size={12} /> 還有欄位需要填寫，請看標示紅字的地方
          </p>
        )}
        <p className="text-stone-400 text-[11px] leading-relaxed mt-3 text-center">
          送出後會寄一封訂單確認信到您的 Email；到貨後我們會通知您到合作社取貨並付款。
        </p>
      </div>

      {/* ---------- 確認 / 送出 / 失敗 對話框 ---------- */}
      {(step === 'confirm' || step === 'sending' || step === 'error') && (
        <div
          className="fixed inset-0 z-[60] bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="nda-confirm-title"
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
                  您填的內容還在，可以再試一次；或改用下方的備援訂購單，我們一樣收得到。
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
                  <h3 id="nda-confirm-title" className="text-lg font-extrabold text-white">
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
                      <span>運費（{NDA_PICKUP_LABEL}）</span>
                      <span className="font-bold text-green-400">免運費</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2.5 border-t border-amber-500/30">
                      <span className="text-white font-bold">應付總金額</span>
                      <span className="text-2xl font-extrabold text-amber-400">{currency(totals.total)}</span>
                    </div>
                  </div>

                  <dl className="bg-stone-900 rounded-xl p-4 space-y-2 text-stone-300 border border-white/10">
                    <div className="flex gap-3"><dt className="text-stone-500 w-16 flex-shrink-0">姓名</dt><dd>{name}</dd></div>
                    <div className="flex gap-3"><dt className="text-stone-500 w-16 flex-shrink-0">取貨</dt><dd>{NDA_PICKUP_LABEL}（免運費）</dd></div>
                    <div className="flex gap-3"><dt className="text-stone-500 w-16 flex-shrink-0">付款</dt><dd>取貨時付款</dd></div>
                    <div className="flex gap-3"><dt className="text-stone-500 w-16 flex-shrink-0">Email</dt><dd className="break-all">{email}</dd></div>
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

export default NdaOrderForm;
