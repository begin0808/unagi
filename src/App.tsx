import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, ChevronDown, MessageCircle, MapPin, 
  Clock, CheckCircle, Award, Sparkles, Flame, Truck, 
  Utensils, ExternalLink, HelpCircle, ChevronRight, Gift, Mail
} from 'lucide-react';
import OrderForm from './components/OrderForm';
import {
  PRODUCTS, EMPTY_QUANTITIES, shippingFaqLines, PRICE_PER_KG, PAYMENT_DEADLINE_HOURS, PICKUP_SPOTS, currency,
  type Quantities, type SpecId,
} from './lib/pricing';
import { CONTACT_EMAIL } from './lib/contact';

// --- 常見問題資料 (FAQ) ---
const FAQS = [
  {
    question: "何謂外銷日本等級的「青口鰻」？有什麼特別之處？",
    answer: "「青口鰻」是鰻魚中的頂級極品，背部呈現青綠色光澤，肉質特別細緻軟嫩、油脂豐潤。長年專供日本頂級鰻魚料亭外銷，過去在臺灣市場極難買到，是老饕心中的夢幻逸品。"
  },
  {
    question: "運費與宅配方式如何計算？大約幾天送達？",
    answer:
      "我們一律使用「黑貓低溫冷凍宅配」全程保鮮直送：\n" +
      shippingFaqLines() +
      "\n確認訂單與款項後約 1～3 個工作天出貨。中秋等節慶檔期物流較繁忙，建議提早預訂以確保如期到貨。"
  },
  {
    question: "付款方式有哪些？",
    answer:
      "宅配訂單可選擇銀行轉帳（ATM 或網路銀行）或 LINE Pay 付款。選擇轉帳，送出訂單後匯款帳號會寄到您填寫的 Email（訂單確認信）；選擇 LINE Pay 請填寫您的 LINE ID，賣家會加您好友並傳送付款方式。\n" +
      "請於下單後 " + PAYMENT_DEADLINE_HOURS + " 小時內完成付款，確認收款後即安排出貨。使用 LINE Pay 轉帳時，請在留言填寫訂單編號。\n\n" +
      "下單時可以先填匯款人姓名或匯款帳號後五碼，方便我們核對；若還不確定會用哪個帳戶轉帳，轉帳後直接回覆確認信告知即可。\n\n" +
      "也可以選擇在臺南面交（" + PICKUP_SPOTS.join("、") + "，三處擇一），賣家會打電話與您約時間。面交免運費，除了轉帳與 LINE Pay 之外，也可以當面付現。"
  },
  {
    question: "保存方式為何？未開封可以冷凍保存多久？",
    answer: "本產品採用食品級真空密封包裝。收到商品後請立即放入冷凍庫（-18°C 以下保存）。在未拆封冷凍狀態下，最佳賞味期限長達 2 年。拆封後建議儘速加熱食用以享最佳風味。"
  },
  {
    question: "如何快速料理？蒲燒醬汁需要另外調味嗎？",
    answer: "完全不需要！我們已為您調配道地正宗日式蒲燒醬汁，退冰後微波 3~5 分鐘即可直接鋪在熱騰騰白飯上享用。中秋節更可直接放上烤肉架、氣炸鍋或烤箱烘烤，炭香撲鼻、香氣四溢！"
  },
  {
    question: "送禮有附禮盒嗎？需要另外加購嗎？禮盒是怎麼寄的？",
    answer:
      "訂購時選擇「送禮」，即可依要分送的對象人數選擇禮盒數量。\n" +
      "每條鰻魚都是單獨真空包裝，一個禮盒約可裝 3~4 條——大條魚約 3 條、小條魚約 4 條。\n" +
      "免費額度為購買公斤數（買 2 公斤即免費附 2 個）；若要分送更多人可以加購，每個 $50。\n\n" +
      "例如買 2 公斤小條鰻魚（共 8 條），想分送三位親友（3 條、3 條、2 條），\n" +
      "就選 3 個禮盒——其中 2 個免費，第 3 個加購 $50。\n\n" +
      "【禮盒會分開包裝，不會預先裝入鰻魚】\n" +
      "鰻魚全程真空冷凍配送，紙製禮盒若與冷凍品裝在一起容易受潮變軟，\n" +
      "因此禮盒會分開包裝、隨同一箱寄出。請您收到後先將鰻魚冷凍保存，\n" +
      "要送禮之前再自行把鰻魚放入禮盒，這樣禮盒才不會受潮變形，送出去也更體面。\n\n" +
      "若是自己享用，選擇「自用」就不附禮盒，少用一份包裝材，也謝謝您一起節約資源，愛地球。\n\n" +
      "禮盒與商品會寄到同一個地址；如需分別寄送給不同收件人，請分開下單（運費分別計算）。"
  },
  {
    question: "【興旺蒲燒鰻】的產地來源為何？為何受到日本名店肯定？",
    answer: "本品牌源自彰化縣福興鄉「吳奇清養鰻場」，深耕在地數十年，堅持以深海魚粉精細飼育頂級青口鰻。2025 年底更榮獲日本水產權威月刊《ACR》專案特載報導，日本福岡小倉百年鰻魚料理教父「田舎庵」緒方大社長、長野「観光荘」宮澤健社長親臨福興鄉魚塭考察並高度讚揚。品質完全比照外銷日本最高標準！"
  },
  {
    question: "想先詢問或訂單有問題，要怎麼聯絡你們？",
    answer:
      "歡迎來信：" + CONTACT_EMAIL + "\n" +
      "訂單送出後會收到確認信，直接回覆那封信也找得到我們。\n" +
      "到貨時間、指定日期、面交、大量訂購與送禮包裝需求，都可以先與我們討論。"
  },
  {
    question: "退換貨政策：若收到商品有瑕疵或解凍該如何處理？",
    answer: "生鮮冷凍食品攸關食品安全，我們出貨皆嚴格檢驗。若您收到包裹時發現外箱嚴重破損、真空袋失真空或商品解凍變質，請於收件當日立即拍照錄影並與我們聯繫，我們將第一時間為您辦理補寄或換貨處理。"
  }
];

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [quantities, setQuantities] = useState<Quantities>({ ...EMPTY_QUANTITIES });
  
  // 設定網頁頁籤標題
  useEffect(() => {
    document.title = "興旺蒲燒鰻 - 外銷日本頂級青口鰻 | 中秋送禮烤肉首選";
  }, []);

  // 滾動到特定區塊
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  // 規格卡片的按鈕：數量 +1 並捲到訂購區
  const addSpecToOrder = (id: SpecId) => {
    setQuantities((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    scrollToSection('contact');
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-900 selection:text-white animate-fade-in">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-stone-950/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection('hero')}>
              <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center text-stone-950 font-bold text-xl shadow-lg shadow-amber-600/30">
                興
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-widest text-white leading-tight">
                  興旺蒲燒鰻
                </span>
                <span className="text-[10px] text-amber-400 tracking-wider">頂級外銷日本・青口鰻</span>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-7">
              <button onClick={() => scrollToSection('news')} className="text-amber-400 hover:text-amber-300 transition-colors font-bold flex items-center gap-1.5">
                <Sparkles size={16} /> 中秋限定特惠
              </button>
              <button onClick={() => scrollToSection('story')} className="text-stone-300 hover:text-amber-500 transition-colors">青口鰻傳奇</button>
              <a 
                href="./ACR.html" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-amber-300 hover:text-white transition-colors font-semibold flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1 rounded-lg border border-amber-500/30 text-sm group shadow-sm"
              >
                <span>🇯🇵 日本採訪報導</span>
                <ExternalLink size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
              <button onClick={() => scrollToSection('products')} className="text-stone-300 hover:text-amber-500 transition-colors">規格與售價</button>
              <button onClick={() => scrollToSection('cooking')} className="text-stone-300 hover:text-amber-500 transition-colors">美味秘訣</button>
              <button onClick={() => scrollToSection('faq')} className="text-stone-300 hover:text-amber-500 transition-colors">常見問題</button>
              <button onClick={() => scrollToSection('contact')} className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-bold rounded-lg hover:from-amber-500 hover:to-amber-400 transition-all flex items-center gap-2 shadow-lg shadow-amber-600/20">
                <ShoppingBag size={18} />
                立即訂購
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-stone-300 hover:text-white p-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-stone-900 border-b border-white/10">
            <div className="px-4 pt-3 pb-4 space-y-2">
              <button onClick={() => scrollToSection('news')} className="block px-3 py-2 text-base font-bold text-amber-400 w-full text-left">🥮 中秋限定特惠</button>
              <button onClick={() => scrollToSection('story')} className="block px-3 py-2 text-base font-medium text-stone-300 hover:text-white w-full text-left">青口鰻傳奇</button>
              <a 
                href="./ACR.html" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-3 py-2 text-base font-bold text-amber-300 w-full text-left bg-amber-500/10 rounded-lg flex items-center justify-between border border-amber-500/20"
              >
                <span>🇯🇵 日本《ACR》月刊專訪報導</span>
                <ExternalLink size={16} />
              </a>
              <button onClick={() => scrollToSection('products')} className="block px-3 py-2 text-base font-medium text-stone-300 hover:text-white w-full text-left">規格與售價</button>
              <button onClick={() => scrollToSection('cooking')} className="block px-3 py-2 text-base font-medium text-stone-300 hover:text-white w-full text-left">美味秘訣</button>
              <button onClick={() => scrollToSection('faq')} className="block px-3 py-2 text-base font-medium text-stone-300 hover:text-white w-full text-left">常見問題</button>
              <button onClick={() => scrollToSection('contact')} className="block px-3 py-2.5 text-base font-bold bg-amber-600 text-stone-950 rounded-lg w-full text-center mt-2">立即前往訂購</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-stone-950/50 to-stone-950 z-10"></div>
          <img 
            src="./images/hero-bg-new.jpg" 
            alt="炭火慢烤中的頂級蒲燒鰻，油亮焦香" 
            fetchPriority="high"
            decoding="async"
            width={1920}
            height={1047}
            className="w-full h-full object-cover opacity-75 scale-105 transition-transform duration-10000"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.onerror = null;
              target.src = "https://images.unsplash.com/photo-1605333146460-e448b5980753?q=80&w=2000&auto=format&fit=crop"; 
            }}
          />
        </div>

        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto py-16">
          <a 
            href="./ACR.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 via-stone-900 to-amber-500/20 text-amber-300 border border-amber-500/40 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold tracking-wider mb-6 hover:border-amber-400 hover:text-white transition-all group shadow-lg animate-fade-in-up"
          >
            <Award size={16} className="text-amber-400 group-hover:scale-110 transition-transform" />
            <span>彰化福興 吳奇清養鰻場・榮獲日本權威《ACR》專訪報導</span>
            <span className="bg-amber-500 text-stone-950 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 group-hover:bg-amber-400">
              閱讀報導 <ExternalLink size={10} />
            </span>
          </a>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white mb-6 tracking-wider leading-tight">
            【興旺】頂級蒲燒鰻<br/>
            <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent text-2xl sm:text-4xl md:text-5xl inline-block mt-3 font-bold">
              <span className="inline-block">外銷極品</span>
              <span>・</span>
              <span className="inline-block">回饋臺灣鄉親朋友</span>
            </span>
          </h1>
          
          <p className="text-stone-300 text-base sm:text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed [text-wrap:balance]">
            <span className="inline-block">油脂豐潤、肉質細緻</span>
            <span className="inline-block">微波 <span className="whitespace-nowrap">3~5 分鐘</span>，即刻享用道地日式料亭級美味「蒲燒鰻魚飯」</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => scrollToSection('news')}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white text-lg font-bold rounded-xl hover:from-red-500 hover:to-red-600 hover:scale-105 transition-all shadow-[0_0_25px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2"
            >
              <Gift size={20} /> 查看中秋限定優惠
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 text-lg font-bold rounded-xl hover:from-amber-400 hover:to-amber-500 hover:scale-105 transition-all shadow-[0_0_25px_rgba(217,119,6,0.4)] flex items-center justify-center gap-2"
            >
              <ShoppingBag size={20} /> 立即搶鮮預訂
            </button>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce text-stone-500 hidden sm:block">
          <ChevronDown size={28} />
        </div>
      </section>

      {/* Latest News / Mid-Autumn Special */}
      <section id="news" className="py-20 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 border-y border-amber-500/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-60"></div>
        <div className="absolute -left-20 -top-20 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-red-600/10 rounded-full blur-3xl"></div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600/30 to-red-600/30 text-amber-200 px-5 py-2 rounded-full text-sm font-bold mb-5 border border-amber-500/30 shadow-[0_0_20px_rgba(217,119,6,0.2)]">
              <span className="animate-pulse">🥮</span> 中秋特別企劃・伴手禮與烤肉極品
            </div>
            
            <h2 className="text-[1.375rem] sm:text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight [text-wrap:balance]">
              <span className="inline-block">中秋賞月烤肉少不了這一道！</span><br className="hidden sm:inline" />
              <span className="text-amber-400 inline-block">日式料亭級「頂級青口蒲燒鰻」</span>
            </h2>
            
            <p className="text-base sm:text-lg md:text-xl text-stone-300 max-w-2xl mx-auto leading-relaxed [text-wrap:balance]">
              <span className="inline-block">趁中秋前搶鮮下單，烤肉架上香氣逼人，一上桌就被搶光！</span>
              <span className="inline-block">送禮體面又大方，與親友共享外銷日本的尊貴美味。</span>
            </p>
          </div>

          <div className="bg-stone-900/90 backdrop-blur-md p-5 sm:p-8 md:p-10 rounded-3xl border border-amber-500/30 shadow-[0_0_50px_rgba(180,83,9,0.2)]">
            <div className="bg-gradient-to-r from-amber-950/80 via-stone-900 to-red-950/80 p-4 sm:p-6 md:p-8 rounded-2xl border border-amber-500/40 mb-8 text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-lg shadow">
                 超值回饋價
               </div>
               <h3 className="text-xl md:text-2xl font-bold text-amber-300 mt-5 sm:mt-0 mb-2 [text-wrap:balance]">
                 <span className="inline-block">🎏 頂級外銷日本青口鰻</span>
                 <span className="hidden sm:inline">・</span>
                 <span className="inline-block">產地回饋特惠</span>
               </h3>
               <p className="text-stone-300 text-sm md:text-base mb-6 max-w-xl mx-auto [text-wrap:balance]">往年外銷日本一尾難求的高檔滋味，今年以產地實在價格，回饋給臺灣喜愛鰻魚的鄉親朋友！</p>
               
               <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
                  <span className="text-stone-400 line-through text-base sm:text-xl whitespace-nowrap">市售/原價 $1,200/kg</span>
                  <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 bg-amber-500/20 px-4 sm:px-6 py-2.5 rounded-xl border border-amber-400/30">
                    <span className="text-stone-300 font-bold text-base sm:text-lg whitespace-nowrap">極品特惠價</span>
                    {/* 價格與單位綁在一起，換行時不會讓「/ 一公斤」單獨落在下一行開頭 */}
                    <span className="whitespace-nowrap">
                      <span className="text-3xl sm:text-5xl font-extrabold text-amber-400">$1,000</span>
                      <span className="text-stone-200 text-base sm:text-lg ml-1.5">/ 一公斤</span>
                    </span>
                  </div>
               </div>
            </div>

            {/* 核心特色 3 格 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-5 bg-stone-950/60 rounded-xl border border-white/10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                  <Award size={24} />
                </div>
                <h4 className="text-lg font-bold text-white mb-1">外銷頂級青口鰻</h4>
                <p className="text-stone-400 text-sm leading-relaxed">
                  青背白腹、肉質細膩柔滑，油脂豐潤，日本料亭專用最高等級。
                </p>
              </div>

              <div className="p-5 bg-stone-950/60 rounded-xl border border-white/10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-3">
                  <Flame size={24} />
                </div>
                <h4 className="text-lg font-bold text-white mb-1"><span className="whitespace-nowrap">3~5 分鐘</span>快速上桌</h4>
                <p className="text-stone-400 text-sm leading-relaxed">
                  獨門蒲燒醬汁已完美調味！微波、烤箱、氣炸或隔水加熱，美味即刻呈現。
                </p>
              </div>

              <div className="p-5 bg-stone-950/60 rounded-xl border border-white/10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mb-3">
                  <Truck size={24} />
                </div>
                <h4 className="text-lg font-bold text-white mb-1">黑貓冷凍宅配・滿額免運</h4>
                <p className="text-stone-400 text-sm leading-relaxed">
                  真空鎖鮮低溫直送！滿 5 公斤即享全臺免運費，揪團合購最划算。
                </p>
              </div>
            </div>

            <div className="text-center">
              <button 
                onClick={() => scrollToSection('contact')}
                className="w-full sm:w-auto px-6 sm:px-12 py-4 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xl rounded-xl shadow-lg hover:shadow-amber-600/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3 mx-auto"
              >
                <ShoppingBag size={22} />
                立即填單預購中秋極品
              </button>
              <p className="mt-3 text-stone-400 text-sm">※ 中秋檔期訂單量大，建議儘早下單確保順利出貨</p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section id="story" className="py-24 bg-stone-900/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-block border-b-2 border-amber-500 pb-1">
                <span className="text-amber-500 font-bold tracking-widest uppercase text-sm">BRAND STORY・產地職人</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-snug [text-wrap:balance]">
                <span className="inline-block">彰化福興深耕數十年，</span>
                <span className="text-amber-400 inline-block">日本名店社長親赴魚塭實勘認證</span>
              </h2>
              <div className="text-stone-300 text-base sm:text-lg leading-relaxed space-y-4">
                <p>
                  <strong className="text-white">【興旺蒲燒鰻】</strong>源自彰化縣福興鄉<strong className="text-amber-400">「吳奇清養鰻場」</strong>，長年專注於培育外銷日本頂級料亭的最高品質——<strong className="text-amber-400">「青口鰻」</strong>。
                </p>
                <p>
                  我們以深海魚粉與純淨水質精細飼育，培育出的青口鰻背青腹白、油脂豐厚、肉質細膩柔滑。2025 年底，日本權威水產月刊《ACR》偕同全日本鰻魚料理界泰斗——福岡小倉百年名店<strong className="text-white">「田舎庵」緒方大社長</strong>、長野<strong className="text-white">「観光荘」宮澤健社長</strong>與臺灣鰻蝦同業公會<strong className="text-white">郭瓊英理事長</strong>，專程實地走訪<strong>福興鄉吳奇清養鰻場</strong>魚塭池畔深入考察，給予最高讚賞！
                </p>
                <p>
                  過去受日本名店青睞的頂級極品幾乎第一時間空運外銷；今年我們除了持續穩定外銷日本，也特別保留外銷料亭極品，<strong className="text-amber-300">誠摯推薦給臺灣喜愛鰻魚的鄉親朋友共同品嚐！</strong>
                </p>
              </div>
              
              <div className="pt-2">
                <a 
                  href="./ACR.html" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block group"
                >
                  <div className="flex items-center justify-between gap-4 bg-stone-950/90 p-4 rounded-xl border border-amber-500/30 hover:border-amber-400 transition-all shadow-lg group-hover:bg-stone-900">
                    <div className="flex items-center gap-3.5">
                      <div className="bg-amber-600/20 p-2.5 rounded-xl text-amber-400 flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Award size={28} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-bold text-base sm:text-lg group-hover:text-amber-300 transition-colors">
                            日本權威《ACR》專題報導
                          </h4>
                          <span className="bg-red-700 text-white text-[10px] font-bold px-2 py-0.5 rounded">產地紀行</span>
                        </div>
                        <p className="text-stone-400 text-xs sm:text-sm mt-0.5">
                          「田舎庵」緒方社長親訪彰化福興吳奇清養鰻場實勘紀行
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center text-amber-400 text-xs font-bold gap-1 flex-shrink-0">
                      <span>點選閱讀</span>
                      <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </a>
              </div>
            </div>
            
            {/* Brand Story Image - Full Authentic Layout from ACR Report */}
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-amber-600/30 to-red-600/30 rounded-2xl blur-lg"></div>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-amber-500/30 bg-stone-900">
                <img 
                  src="./acr_images/wu_full_magazine_original.jpg" 
                  alt="日本水產月刊 ACR 第10頁完整刊載：彰化縣福興鄉吳奇清養鰻場" 
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto object-contain block mx-auto hover:scale-[1.01] transition-transform duration-300"
                />
                <div className="p-4 bg-stone-950/95 border-t border-stone-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="bg-amber-500 text-stone-950 text-xs font-extrabold px-2.5 py-0.5 rounded">
                      日本《ACR》月刊刊載原貌・未經裁切
                    </span>
                    <a 
                      href="./ACR.html#wu-special" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-amber-400 hover:text-amber-300 text-xs font-bold flex items-center gap-1 group"
                    >
                      <span>點選查看報導內容</span>
                      <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                  <p className="text-white font-bold text-sm sm:text-base">彰化福興 吳奇清養鰻場現場紀行</p>
                  <p className="text-stone-400 text-xs leading-relaxed mt-0.5">
                    日本料理教父「田舎庵」緒方大社長親赴魚塭實勘，包含高標水質巡檢、深海魚粉投飼與池畔大合影
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-24 bg-stone-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block bg-amber-600/20 text-amber-300 px-4 py-1 rounded-full text-sm font-bold mb-3 border border-amber-500/30">
              嚴選規格・均一特惠
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 [text-wrap:balance]">三種規格・滿足不同挑剔味蕾</h2>
            <p className="text-stone-400 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed [text-wrap:balance]">
              <span className="inline-block">每種規格每包均為 <strong className="text-white">一公斤裝</strong>，均一超值特惠價 <strong className="text-amber-400 font-bold whitespace-nowrap">{currency(PRICE_PER_KG)} 元/kg</strong>。</span>
              <span className="inline-block">蒲燒醬汁已完美調味，冷凍真空包裝，效期長達兩年。</span>
            </p>
            
            {/* 口感挑選指引 Banner */}
            <div className="mt-6 max-w-2xl mx-auto bg-stone-900 p-4 rounded-xl border border-amber-500/30 text-stone-200 text-sm sm:text-base flex flex-col sm:flex-row items-center justify-center gap-2 shadow-lg">
               <span className="bg-amber-500 text-stone-950 font-bold text-xs px-2.5 py-1 rounded-md">挑選指南</span>
               <span className="[text-wrap:balance]">
                 <span className="inline-block"><strong className="text-amber-400">越少條魚越大</strong>（肉厚Ｑ彈大口滿足）</span>
                 <span className="inline-block px-1">⇄</span>
                 <span className="inline-block"><strong className="text-amber-400">越多條魚越小</strong>（肉質軟嫩細膩順口）</span>
               </span>
            </div>
          </div>

          {/* 情境示意圖 2 格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="relative h-60 md:h-72 rounded-2xl overflow-hidden group bg-stone-900 border border-white/10">
               <img
                 src="./images/01.jpg"
                 alt="炭火直烤鰻魚情境"
                 loading="lazy"
                 decoding="async"
                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                 onError={(e) => {
                   const target = e.currentTarget as HTMLImageElement;
                   target.onerror = null;
                   target.src = "https://images.unsplash.com/photo-1629239851608-8e8156db6933?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
                 }}
               />
               <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent p-6">
                 <p className="text-white font-bold text-lg">炭火直烤・油亮焦香</p>
                 <p className="text-stone-300 text-xs sm:text-sm">頂級青口鰻油脂豐厚，炭火逼出濃郁迷人香氣</p>
               </div>
            </div>

            <div className="relative h-60 md:h-72 rounded-2xl overflow-hidden group bg-stone-900 border border-white/10">
               <img
                 src="./images/02.jpg" 
                 alt="真空包裝加熱即食"
                 loading="lazy"
                 decoding="async"
                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                 onError={(e) => {
                   const target = e.currentTarget as HTMLImageElement;
                   target.onerror = null;
                   target.src = "https://images.unsplash.com/photo-1582260656034-7c36a48d8c39?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
                 }}
               />
               <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent p-6">
                 <p className="text-white font-bold text-lg">真空鎖鮮・加熱即享</p>
                 <p className="text-stone-300 text-xs sm:text-sm">零廚藝也能輕鬆端出道地日式料亭鰻魚飯</p>
               </div>
            </div>
          </div>

          {/* 3 種規格卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PRODUCTS.map((product) => (
              <div 
                key={product.id} 
                className="group bg-stone-900/90 rounded-2xl overflow-hidden border border-white/10 hover:border-amber-500/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(217,119,6,0.2)] flex flex-col relative"
              >
                {/* 規格標籤 */}
                <div className="absolute top-0 right-0 bg-stone-800 text-amber-300 px-4 py-1.5 rounded-bl-xl font-bold text-sm border-l border-b border-white/10 z-10">
                   規格 {product.code}
                </div>

                <div className="p-7 flex-1 flex flex-col">
                  <div className="mb-4">
                    <span className={`${product.tagColor} text-white text-xs font-bold px-3 py-1 rounded-full uppercase shadow-md inline-block`}>
                      {product.tag}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-extrabold text-white mb-1">{product.name}</h3>
                  <p className="text-amber-400 text-xs font-semibold mb-4">{product.spec}</p>
                  
                  <div className="flex items-baseline gap-2 mb-5 p-3 bg-stone-950/70 rounded-xl border border-white/5">
                     <span className="text-stone-500 line-through text-sm">原價 ${product.originalPrice}</span>
                     <span className="text-3xl font-extrabold text-red-500">${product.price}</span>
                     <span className="text-xs text-stone-400">/ 1kg</span>
                  </div>

                  <p className="text-stone-200 font-medium text-sm sm:text-base mb-3 leading-relaxed">
                    {product.description}
                  </p>
                  <p className="text-stone-400 text-xs sm:text-sm mb-6 flex-1 leading-relaxed bg-stone-950/40 p-3 rounded-lg border border-white/5">
                    {product.detail}
                  </p>
                  
                  <button 
                    onClick={() => addSpecToOrder(product.id as SpecId)}
                    className="w-full py-3 bg-stone-800 hover:bg-amber-600 text-stone-100 hover:text-stone-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 group-hover:shadow-md"
                  >
                    加入訂購單 <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cooking Guide Section */}
      <section id="cooking" className="py-24 bg-stone-900 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-amber-600/20 text-amber-300 px-4 py-1 rounded-full text-sm font-bold mb-3 border border-amber-500/30">
              美味輕鬆享用
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 [text-wrap:balance]">
              <span className="whitespace-nowrap">3~5 分鐘</span>料亭美味上桌
            </h2>
            <p className="text-stone-400 text-base sm:text-lg max-w-xl mx-auto [text-wrap:balance] leading-relaxed">
              <span className="inline-block">蒲燒醬汁已完美入味，無需繁複料理步驟，</span>
              <span className="inline-block">任選以下方式加熱，即可還原炭烤極致風味！</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. 微波 */}
            <div className="bg-stone-950 p-7 rounded-2xl border border-white/10 text-center group hover:border-amber-500/50 transition-all hover:bg-stone-950/80">
               <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 text-amber-400 group-hover:scale-110 transition-transform border border-amber-500/20">
                 <Utensils size={32} />
               </div>
               <h3 className="text-white font-bold text-lg mb-2">微波加熱（最推薦）</h3>
               <p className="text-amber-400 text-xs font-bold mb-2 [text-wrap:balance]">退冰・需拆袋・<span className="whitespace-nowrap">3~5 分鐘</span></p>
               <p className="text-stone-400 text-xs leading-relaxed">
                 拆開真空袋將鰻魚置於盤中微波，醬汁熱氣騰騰，鋪在熱白飯上就是頂級鰻魚飯！
               </p>
            </div>
            
            {/* 2. 中秋烤肉/烤箱 */}
            <div className="bg-stone-950 p-7 rounded-2xl border border-white/10 text-center group hover:border-red-500/50 transition-all hover:bg-stone-950/80">
               <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 text-red-400 group-hover:scale-110 transition-transform border border-red-500/20">
                 <Flame size={32} />
               </div>
               <h3 className="text-white font-bold text-lg mb-2">中秋炭烤 / 烤箱</h3>
               <p className="text-red-400 text-xs font-bold mb-2 [text-wrap:balance]">微退冰・需拆袋・<span className="whitespace-nowrap">5~10 分鐘</span></p>
               <p className="text-stone-400 text-xs leading-relaxed">
                 置於烤肉網或烤箱慢火覆熱，逼出豐厚油脂與炭香，外皮微焦香脆、香氣四溢！
               </p>
            </div>

            {/* 3. 氣炸鍋 */}
            <div className="bg-stone-950 p-7 rounded-2xl border border-white/10 text-center group hover:border-amber-500/50 transition-all hover:bg-stone-950/80">
               <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 text-amber-400 group-hover:scale-110 transition-transform border border-amber-500/20">
                 <Clock size={32} />
               </div>
               <h3 className="text-white font-bold text-lg mb-2">氣炸鍋加熱</h3>
               <p className="text-amber-400 text-xs font-bold mb-2 [text-wrap:balance]">退冰・需拆袋・<span className="whitespace-nowrap">160°C 6~8 分鐘</span></p>
               <p className="text-stone-400 text-xs leading-relaxed">
                 以氣炸鍋 160°C 烘烤約 6~8 分鐘，鎖住肉汁同時增添表皮酥香口感。
               </p>
            </div>

            {/* 4. 隔水加熱 */}
            <div className="bg-stone-950 p-7 rounded-2xl border border-white/10 text-center group hover:border-green-500/50 transition-all hover:bg-stone-950/80">
               <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 text-green-400 group-hover:scale-110 transition-transform border border-green-500/20">
                 <CheckCircle size={32} />
               </div>
               <h3 className="text-white font-bold text-lg mb-2">隔水水煮加熱</h3>
               <p className="text-green-400 text-xs font-bold mb-2 [text-wrap:balance]">無需退冰・不拆袋・<span className="whitespace-nowrap">滾水 3~5 分鐘</span></p>
               <p className="text-stone-400 text-xs leading-relaxed">
                 真空包直接放入沸水浸煮加熱 3~5 分鐘，完整保留原汁原味，最方便多汁。
               </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-stone-950 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white mb-3 flex items-center justify-center gap-2">
              <HelpCircle className="text-amber-500" /> 常見問題與購買須知
            </h2>
            <p className="text-stone-400 text-sm sm:text-base">
              關於青口鰻品質、保存方式、低溫宅配運費與退換貨說明的詳細解答。
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => (
              <div key={index} className="bg-stone-900/90 rounded-2xl border border-white/10 overflow-hidden hover:border-amber-500/30 transition-colors">
                <div className="p-6">
                  <h3 className="text-base sm:text-lg font-bold text-amber-400 mb-3 flex items-start gap-2.5">
                    <span className="mt-0.5 text-amber-500 flex-shrink-0"><ChevronRight size={18} /></span>
                    <span>{faq.question}</span>
                  </h3>
                  <p className="text-stone-300 pl-7 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Order Section */}
      <section id="contact" className="py-24 bg-stone-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-amber-600/5 skew-x-12 transform translate-x-1/4 pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-10">
            <div className="inline-block bg-amber-600/20 text-amber-300 px-4 py-1 rounded-full text-sm font-bold mb-3 border border-amber-500/30">
              線上訂購・黑貓冷凍宅配
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 [text-wrap:balance]">
              立即預約頂級美味
            </h2>
            <p className="text-stone-400 text-base sm:text-lg max-w-xl mx-auto [text-wrap:balance] leading-relaxed">
              <span className="inline-block">選好規格數量、填妥收件資料即可送出訂單，</span>
              <span className="inline-block">系統會自動為您計算運費與應付總金額。</span>
            </p>
          </div>

          <OrderForm quantities={quantities} setQuantities={setQuantities} />

          <div className="mt-8 max-w-3xl mx-auto bg-stone-800/70 p-5 rounded-xl border border-white/10">
            <div className="flex items-start gap-3">
              <div className="bg-amber-600/20 p-2 rounded-lg text-amber-400 flex-shrink-0 mt-0.5">
                <MessageCircle size={20} />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm sm:text-base">訂購小叮嚀</h4>
                <p className="text-stone-400 text-xs sm:text-sm leading-relaxed mt-1 [text-wrap:balance]">
                  {/* 每句各自 inline-block：JSX 換行會產生空白，直接寫多行會在句子交界處
                      造成怪異的斷行（單字被留在行尾） */}
                  <span className="inline-block">規格 A 為 3 條裝、B 為 4 條裝、</span>
                  <span className="inline-block">C 為 5 條裝，每包均為 1 公斤，可自由混搭。</span>
                  <span className="inline-block">送出後會立即寄一封訂單確認信，</span>
                  <span className="inline-block">請至您填寫的 Email 收信核對；</span>
                  <span className="inline-block">內容有誤直接回覆該封信告知即可。</span>
                  <span className="inline-block">我們也會由專人與您聯繫，</span>
                  <span className="inline-block">確認出貨或取貨時間；</span>
                  <span className="inline-block">中秋等節慶檔期物流較繁忙，建議提早下單。</span>
                  <span className="inline-block">到貨時間、指定日期、面交、</span>
                  <span className="inline-block">大量訂購與送禮包裝，</span>
                  <span className="inline-block">歡迎先來信洽詢（信箱見頁尾）。</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-950 py-12 border-t border-white/10 text-center">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-7 h-7 bg-amber-600 rounded-full flex items-center justify-center text-stone-950 font-bold text-sm">
              興
            </div>
            <span className="font-bold text-lg tracking-wider text-white">興旺蒲燒鰻</span>
          </div>

          <div className="text-stone-400 text-sm mb-2">訂購與客服請來信</div>

          <div className="mb-5">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-stone-400 hover:text-amber-400 text-sm inline-flex items-center gap-1.5 transition-colors break-all"
            >
              <Mail size={15} className="text-amber-500 flex-shrink-0" /> {CONTACT_EMAIL}
            </a>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-8 mb-4 text-stone-400 text-sm">
            <p className="flex items-center gap-1.5">
               <MapPin size={16} className="text-amber-500" />
               <span className="whitespace-nowrap">產地：臺灣彰化鹿港 / 福興</span><span className="whitespace-nowrap">（吳奇清養鰻場）</span>
            </p>
            <p className="flex items-center gap-1.5">
               <Truck size={16} className="text-amber-500" />
               <span>配送：黑貓低溫冷凍宅配</span>
            </p>
            <a 
               href="./ACR.html" 
               target="_blank" 
               rel="noopener noreferrer" 
               className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold transition-colors underline underline-offset-4"
            >
               <span>🇯🇵 日本《ACR》專訪報導</span>
               <ExternalLink size={14} />
            </a>
          </div>

          <p className="text-stone-500 text-xs">
            &copy; 2026 興旺蒲燒鰻. All rights reserved. 頂級外銷日本青口鰻專賣.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;