import React, { useEffect, useState } from 'react';
import { Award, Flame, Utensils, Clock, CheckCircle, AlertTriangle, Phone, MapPin, ExternalLink } from 'lucide-react';
import NdaOrderForm from './components/NdaOrderForm';
import {
  PRODUCTS, SPECS, EMPTY_QUANTITIES, PRICE_PER_KG, NDA_PICKUP_LABEL, currency,
  type Quantities, type SpecId,
} from './lib/pricing';
import { PHONES, formatPhone, telHref } from './lib/contact';

/** 規格卡用訂購表單裡的短名稱，長名稱在窄卡片裡會從括號中間斷行 */
const SHORT_NAME: Record<string, string> = Object.fromEntries(SPECS.map((s) => [s.id, s.name]));

/**
 * 南大附中合作社專屬訂購頁（nda.html）。
 *
 * 主網站是對外的行銷頁；這一頁只給校內同仁使用，
 * 取貨與付款方式固定，不問電話、地址與 Email，也沒有優惠碼與宅配運費。
 */
const NdaApp = () => {
  const [quantities, setQuantities] = useState<Quantities>({ ...EMPTY_QUANTITIES });

  useEffect(() => {
    document.title = '興旺蒲燒鰻｜南大附中合作社訂購';
  }, []);

  const addSpec = (id: SpecId) => {
    setQuantities((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    document.getElementById('nda-order')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-900 selection:text-white">
      {/* 頁首 */}
      <header className="bg-stone-950 border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center text-stone-950 font-bold text-xl shadow-lg shadow-amber-600/30 flex-shrink-0">
            興
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-lg sm:text-xl tracking-widest text-white leading-tight">興旺蒲燒鰻</span>
            <span className="text-[11px] sm:text-xs text-amber-400 tracking-wider">南大附中合作社專屬訂購</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        {/* 開場 */}
        <section className="text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-300 border border-amber-500/30 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-5">
            <Award size={15} className="text-amber-400" />
            <span className="inline-block">外銷日本頂級青口鰻</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-4 leading-tight [text-wrap:balance]">
            <span className="inline-block">日式料亭級蒲燒鰻</span>
            <span className="inline-block">・合作社取貨</span>
          </h1>
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed [text-wrap:balance]">
            <span className="inline-block">彰化福興「吳奇清養鰻場」長年外銷日本料亭的青口鰻，</span>
            <span className="inline-block">油脂豐潤、肉質細緻。</span>
            <span className="inline-block">醬汁已調好，微波 <span className="whitespace-nowrap">3~5 分鐘</span>即可享用。</span>
          </p>
          <p className="text-amber-300 text-sm sm:text-base font-bold mt-5">
            <span className="inline-block">每包 1 公斤，均一價 {currency(PRICE_PER_KG)}</span>
            <span className="inline-block">・{NDA_PICKUP_LABEL}取貨，免運費</span>
          </p>
        </section>

        {/* 三種規格 */}
        <section>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-2">三種規格，可自由混搭</h2>
          <p className="text-stone-400 text-xs sm:text-sm mb-5 [text-wrap:balance]">
            <span className="inline-block"><strong className="text-amber-400">越少條魚越大</strong>（肉厚Ｑ彈）</span>
            <span className="inline-block px-1">⇄</span>
            <span className="inline-block"><strong className="text-amber-400">越多條魚越小</strong>（軟嫩順口）</span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PRODUCTS.map((product) => (
              <div
                key={product.id}
                className="bg-stone-900/90 rounded-2xl border border-white/10 p-5 flex flex-col hover:border-amber-500/50 transition-colors"
              >
                <span className="bg-stone-800 text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded self-start mb-2">
                  規格 {product.code}
                </span>
                <h3 className="text-lg font-extrabold text-white">{SHORT_NAME[product.id] || product.name}</h3>
                <p className="text-amber-400 text-xs font-semibold mb-3">{product.spec}</p>
                <p className="text-stone-400 text-xs leading-relaxed flex-1">{product.description}</p>
                <button
                  onClick={() => addSpec(product.id as SpecId)}
                  className="w-full mt-4 py-2.5 bg-stone-800 hover:bg-amber-600 text-stone-100 hover:text-stone-950 font-bold text-sm rounded-xl transition-colors"
                >
                  加入訂購單
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 加熱方式 */}
        <section>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-4">
            <span className="whitespace-nowrap">3~5 分鐘</span>就能上桌
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: <Utensils size={18} />, title: '微波加熱（最推薦）', detail: '退冰、拆袋，微波 3~5 分鐘' },
              { icon: <CheckCircle size={18} />, title: '隔水加熱', detail: '免退冰、不拆袋，滾水煮 3~5 分鐘' },
              { icon: <Clock size={18} />, title: '氣炸鍋', detail: '退冰、拆袋，160°C 烤 6~8 分鐘' },
              { icon: <Flame size={18} />, title: '烤箱 / 炭烤', detail: '微退冰、拆袋，烤 5~10 分鐘' },
            ].map((way) => (
              <div key={way.title} className="bg-stone-900/70 rounded-xl border border-white/10 p-4 flex items-start gap-3">
                <span className="text-amber-400 mt-0.5 flex-shrink-0">{way.icon}</span>
                <div>
                  <p className="text-white font-bold text-sm">{way.title}</p>
                  <p className="text-stone-400 text-xs mt-0.5">{way.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 食用提醒 */}
          <div className="mt-4 bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-100 text-sm leading-relaxed [text-wrap:balance]">
              <span className="inline-block">食用提醒：</span>
              <span className="inline-block">鰻魚接近尾部稍有細刺，</span>
              <span className="inline-block">食用時請留意，</span>
              <span className="inline-block">小朋友食用請由大人先行分切。</span>
            </p>
          </div>
        </section>

        {/* 訂購表單 */}
        <section id="nda-order">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-4">填寫訂購單</h2>
          <NdaOrderForm quantities={quantities} setQuantities={setQuantities} />
        </section>

        {/* 小叮嚀 */}
        <section className="bg-stone-900/70 rounded-2xl border border-white/10 p-5">
          <h2 className="text-white font-bold text-base mb-2 flex items-center gap-2">
            <MapPin size={18} className="text-green-400" /> 訂購小叮嚀
          </h2>
          <div className="text-stone-400 text-xs sm:text-sm leading-relaxed space-y-1.5 [text-wrap:balance]">
            <p>
              <span className="inline-block">規格 A 為 3 條裝、B 為 4 條裝、C 為 5 條裝，</span>
              <span className="inline-block">每包均為 1 公斤，可自由混搭。</span>
            </p>
            <p>
              <span className="inline-block">一律於 {NDA_PICKUP_LABEL} 取貨，</span>
              <span className="inline-block">取貨時當面付款，免運費。</span>
            </p>
            <p>
              <span className="inline-block">這個頁面不會寄送訂單確認信，</span>
              <span className="inline-block">請在送出後截圖保存訂單編號。</span>
            </p>
            <p>
              <span className="inline-block">未開封冷凍（-18°C 以下）可保存 2 年，</span>
              <span className="inline-block">拆封後請儘速加熱食用。</span>
            </p>
          </div>
        </section>
      </main>

      {/* 頁尾 */}
      <footer className="bg-stone-950 py-10 border-t border-white/10 text-center">
        <div className="max-w-3xl mx-auto px-4 space-y-3">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-5">
            <span className="flex items-center gap-1.5 text-stone-400 text-sm">
              <Phone size={16} className="text-amber-500" /> 訂購專線
            </span>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5">
              {PHONES.map((p) => (
                <a
                  key={p}
                  href={telHref(p)}
                  className="text-white font-bold tracking-wide hover:text-amber-400 transition-colors whitespace-nowrap"
                >
                  {formatPhone(p)}
                </a>
              ))}
            </div>
          </div>
          <p className="text-stone-400 text-sm flex items-center justify-center gap-1.5">
            <MapPin size={15} className="text-amber-500" />
            <span className="whitespace-nowrap">產地：彰化福興</span>
            <span className="whitespace-nowrap">（吳奇清養鰻場）</span>
          </p>
          <a
            href="./"
            className="text-amber-400 hover:text-amber-300 text-sm inline-flex items-center gap-1 transition-colors"
          >
            查看完整介紹與日本《ACR》專訪 <ExternalLink size={13} />
          </a>
          <p className="text-stone-500 text-xs pt-2">&copy; 2026 興旺蒲燒鰻. 頂級外銷日本青口鰻專賣.</p>
        </div>
      </footer>
    </div>
  );
};

export default NdaApp;
