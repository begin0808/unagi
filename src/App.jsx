import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, ChevronDown, Star, MessageCircle, MapPin, Phone, Instagram, Facebook, 
  Clock, CheckCircle, Award, Heart, ShieldCheck, Megaphone, Calendar, Flame, Truck, 
  Utensils, ExternalLink, User, HelpCircle, ChevronRight 
} from 'lucide-react';

// --- 產品資料 ---
const PRODUCTS = [
  {
    id: 'A',
    code: "A",
    name: "霸氣大型魚 (3尾/kg)",
    price: 1200,
    originalPrice: 1300,
    description: "肉質紮實、口感Q彈。每片約333g，長約30公分。",
    detail: "喜愛大口吃肉、享受紮實口感的最佳選擇。",
    tag: "口感紮實"
  },
  {
    id: 'B',
    code: "B",
    name: "經典中型魚 (4尾/kg)",
    price: 1200,
    originalPrice: 1300,
    description: "口感細膩柔滑、入口即化、魚刺較少。每片約250g，長約26公分。",
    detail: "老饕推薦！油脂與肉質的完美平衡。",
    tag: "人氣首選"
  },
  {
    id: 'C',
    code: "C",
    name: "珍稀小型魚 (5尾/kg)",
    price: 1200,
    originalPrice: 1300,
    description: "此為珍稀款，數量不多。每片約200g。越小條刺越少！",
    detail: "怕刺的人強烈建議選購此款或中型魚。",
    tag: "限量 / 刺少"
  }
];

// --- 常見問題資料 (FAQ) ---
const FAQS = [
  {
    question: "退換貨政策：若商品有問題該如何處理？",
    answer: "（待更新：收到商品後請立即檢查，若發現包裝破損或解凍狀況，請於 24 小時內拍照並聯繫我們，我們將盡速為您處理。）"
  },
  {
    question: "保存方式：收到後要冰冷凍還是冷藏？可以放多久？",
    answer: "（待更新：本產品採真空包裝，收到後請務必「冷凍保存」。在未拆封且冷凍狀態下，最佳賞味期為兩年。）"
  },
  {
    question: "運送細節：黑貓宅配大約幾天到？",
    answer: "（待更新：確認訂單與款項後，我們將安排黑貓低溫宅配寄出。一般情況下，出貨後約 1-3 個工作天可送達。）"
  }
];

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // 控制 FAQ 折疊狀態 (預設全開或全關，這裡示範簡單列表，不需複雜狀態)
  
  // 設定網頁頁籤標題
  useEffect(() => {
    document.title = "興旺蒲燒鰻";
  }, []);

  // 滾動到特定區塊
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-900 selection:text-white animate-fade-in">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-stone-950/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('hero')}>
              <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center text-stone-950 font-bold text-xl">
                興
              </div>
              <span className="font-bold text-xl tracking-widest text-white">
                興旺蒲燒鰻
              </span>
            </div>
            
            <div className="hidden md:flex space-x-8">
              <button onClick={() => scrollToSection('news')} className="text-red-400 hover:text-red-300 transition-colors font-bold flex items-center gap-1">
                <Megaphone size={16} /> 最新消息
              </button>
              <button onClick={() => scrollToSection('products')} className="text-stone-300 hover:text-amber-500 transition-colors">嚴選商品</button>
              <button onClick={() => scrollToSection('cooking')} className="text-stone-300 hover:text-amber-500 transition-colors">美味秘訣</button>
              <button onClick={() => scrollToSection('faq')} className="text-stone-300 hover:text-amber-500 transition-colors">購物須知</button>
              <button onClick={() => scrollToSection('contact')} className="px-4 py-2 bg-amber-600 text-stone-950 font-bold rounded hover:bg-amber-500 transition-all flex items-center gap-2">
                <ShoppingBag size={18} />
                立即訂購
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-stone-300 hover:text-white">
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
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <button onClick={() => scrollToSection('news')} className="block px-3 py-2 text-base font-bold text-red-400 w-full text-left">🔥 最新消息</button>
              <button onClick={() => scrollToSection('products')} className="block px-3 py-2 text-base font-medium text-stone-300 hover:text-white w-full text-left">嚴選商品</button>
              <button onClick={() => scrollToSection('cooking')} className="block px-3 py-2 text-base font-medium text-stone-300 hover:text-white w-full text-left">美味秘訣</button>
              <button onClick={() => scrollToSection('faq')} className="block px-3 py-2 text-base font-medium text-stone-300 hover:text-white w-full text-left">購物須知</button>
              <button onClick={() => scrollToSection('contact')} className="block px-3 py-2 text-base font-bold text-amber-500 w-full text-left">前往訂購</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/60 via-stone-950/40 to-stone-950 z-10"></div>
          {/* 使用相對路徑 ./images/ */}
          <img 
            src="./images/hero-bg-new.jpg" 
            alt="Grilled Eel Hero Background" 
            className="w-full h-full object-cover opacity-80"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://images.unsplash.com/photo-1605333146460-e448b5980753?q=80&w=2000&auto=format&fit=crop"; 
            }}
          />
        </div>

        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto mt-16">
          <h2 className="text-amber-500 font-medium tracking-[0.3em] mb-4 text-lg md:text-xl animate-fade-in-up">
            鹿港在地・外銷日本 No.1
          </h2>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-wider leading-tight">
            【興旺】蒲燒鰻<br/>
            <span className="text-amber-500 text-4xl md:text-6xl">頂級品質 最佳嚴選</span>
          </h1>
          <p className="text-stone-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            榮獲日本電視台跨海採訪殊榮。<br/>
            深海魚粉飼養的極致美味，將這份外銷日本的驕傲留在台灣。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => scrollToSection('news')}
              className="px-8 py-4 bg-red-700 text-white text-lg font-bold rounded hover:bg-red-600 hover:scale-105 transition-all shadow-[0_0_20px_rgba(185,28,28,0.4)] flex items-center justify-center gap-2"
            >
              <Megaphone size={20} /> 看年節優惠
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="px-8 py-4 bg-amber-600 text-stone-950 text-lg font-bold rounded hover:bg-amber-500 hover:scale-105 transition-all shadow-[0_0_20px_rgba(217,119,6,0.4)]"
            >
              立即預訂
            </button>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-stone-500">
          <ChevronDown size={32} />
        </div>
      </section>

      {/* Latest News */}
      <section id="news" className="py-20 bg-gradient-to-b from-stone-950 to-red-950/30 border-y border-red-900/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-red-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl"></div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-red-900/40 text-red-200 px-5 py-2 rounded-full text-sm font-bold mb-8 border border-red-500/30 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
            <span className="animate-pulse">🔥</span> 最新消息・年節限定
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            年菜少不了這一道！<br/>
            <span className="text-amber-500">團圓秒殺・必吃蒲燒鰻</span>
          </h2>
          
          <p className="text-xl text-stone-300 mb-10 font-medium leading-relaxed">
            💕 冷凍庫必囤美食！美味又營養，<br className="md:hidden"/>料理超方便，<span className="text-amber-400 font-bold">10分鐘好菜上桌！</span> 💕
          </p>

          <div className="bg-stone-900/80 backdrop-blur-md p-8 md:p-10 rounded-3xl border border-amber-500/30 shadow-[0_0_50px_rgba(180,83,9,0.15)] transform transition-all hover:scale-[1.01]">
            <div className="bg-gradient-to-r from-red-900/60 to-stone-900 p-6 rounded-2xl border border-red-500/30 mb-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">限時優惠</div>
               <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">🧧 過年大降價 🧧</h3>
               <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">
                  <span className="text-stone-500 line-through text-lg md:text-xl">原價 $1300/kg</span>
                  <div className="flex items-baseline gap-1 bg-white/20 px-4 py-1 rounded-lg backdrop-blur-sm">
                    <span className="text-4xl md:text-5xl font-bold text-white">特價 $1200</span>
                    <span className="text-xl text-white/90">/ 一公斤</span>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="flex flex-col items-center p-4 bg-stone-950/50 rounded-xl border border-white/5">
                <div className="text-stone-400 text-sm mb-2 flex items-center gap-2">
                   <Clock size={16} /> 結單時間
                </div>
                <div className="text-2xl font-bold text-white">112/1/3 (二)</div>
                <div className="text-red-400 font-bold mt-1">上午 11:00 準時結單</div>
              </div>
              <div className="flex flex-col items-center p-4 bg-stone-950/50 rounded-xl border border-white/5">
                 <div className="text-stone-400 text-sm mb-2 flex items-center gap-2">
                   <Calendar size={16} /> 預計到貨
                 </div>
                 <div className="text-2xl font-bold text-white">1/5 (四)</div>
                 <div className="text-green-500 font-bold mt-1">貨到通知</div>
              </div>
            </div>

            <button 
              onClick={() => scrollToSection('contact')}
              className="w-full md:w-auto px-12 py-5 bg-red-700 hover:bg-red-600 text-white font-bold text-xl rounded-xl shadow-lg hover:shadow-red-900/50 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 mx-auto"
            >
              <ShoppingBag size={24} />
              立即搶購年菜
            </button>
            <p className="mt-4 text-stone-500 text-sm">數量有限，售完為止</p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section id="story" className="py-24 bg-stone-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            <div className="space-y-8">
              <div className="inline-block border-b-2 border-amber-600 pb-2">
                <span className="text-amber-600 font-bold tracking-widest uppercase">品牌故事</span>
              </div>
              <h2 className="text-4xl font-bold text-white leading-snug">
                來自彰化鹿港，<br/>長年外銷東京的隱形冠軍。
              </h2>
              <div className="text-stone-400 text-lg leading-relaxed space-y-6">
                <p>
                  <strong className="text-white">興旺蒲燒鰻</strong>，在地養殖三十餘年。這是一份原本只獻給日本頂級餐桌的美味，長年來是外銷日本東京第一名的品質保證。
                </p>
                <p>
                  我們的品質之高，甚至迎來<strong className="text-amber-500">日本電視台跨海採訪</strong>之殊榮。適逢大環境變遷，我們決定將這份珍貴的美味留在台灣，讓家鄉的好朋友也能品嚐到這份「小農推薦、品質 No.1」的日本鰻。
                </p>
                <p>
                  高級日本料理，現在在家就能速上桌。這不僅是一次難得的內銷機會，更是我們對台灣這片土地的回饋。
                </p>
              </div>
              
              <div className="pt-6">
                <div className="flex items-center gap-4 bg-stone-800/50 p-4 rounded-lg border border-white/5">
                   <div className="bg-amber-600/20 p-3 rounded-full text-amber-500">
                     <Award size={32} />
                   </div>
                   <div>
                     <h4 className="text-white font-bold text-lg">日本電視台跨海採訪</h4>
                     <p className="text-stone-400 text-sm">品質備受國際肯定的極致殊榮</p>
                   </div>
                </div>
              </div>
            </div>
            
            {/* Brand Story Image */}
            <div className="relative mt-8 md:mt-0">
              <div className="absolute inset-0 border-2 border-amber-600/30 rounded-lg transform translate-x-4 translate-y-4"></div>
              {/* 使用相對路徑 ./images/ */}
              <img 
                src="./images/story.jpg" 
                alt="Chef grilling eel" 
                className="relative rounded-lg shadow-2xl w-full"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1629239851608-8e8156db6933?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"; // 載入失敗時的備用圖
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-24 bg-stone-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">嚴選商品</h2>
            <p className="text-stone-400 max-w-2xl mx-auto">
              每一條都經過嚴格挑選。蒲燒鰻冷凍真空包裝，效期兩年，<br/>
              醬汁已經調味好，只需簡單加熱即可美味上桌。
            </p>
            <div className="mt-4 inline-block bg-amber-900/40 text-amber-200 px-4 py-2 rounded-lg border border-amber-500/30">
               ⚠️ 貼心提醒：偶有細刺請小心！怕刺的人建議選購中型或小型魚。
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="relative h-64 md:h-80 rounded-xl overflow-hidden group bg-stone-900 border border-white/5">
               {/* 使用相對路徑 ./images/ */}
               <img
                 src="./images/01.jpg"
                 alt="嚴選商品情境圖 1"
                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                 onError={(e) => {
                   e.target.onerror = null;
                   e.target.src = "https://images.unsplash.com/photo-1629239851608-8e8156db6933?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
                 }}
               />
               <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-6">
                 <p className="text-white font-bold text-lg">炭火直烤・香氣四溢</p>
               </div>
            </div>

            <div className="relative h-64 md:h-80 rounded-xl overflow-hidden group bg-stone-900 border border-white/5">
               {/* 使用相對路徑 ./images/ */}
               <img
                 src="./images/02.jpg" 
                 alt="嚴選商品情境圖 2"
                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                 onError={(e) => {
                   e.target.onerror = null;
                   e.target.src = "https://images.unsplash.com/photo-1582260656034-7c36a48d8c39?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
                 }}
               />
               <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-6">
                 <p className="text-white font-bold text-lg">真空鎖鮮・加熱即食</p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PRODUCTS.map((product) => (
              <div key={product.id} className="group bg-stone-900 rounded-xl overflow-hidden border border-white/5 hover:border-amber-600/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(217,119,6,0.15)] flex flex-col relative">
                
                {/* Product Card Content */}
                <div className="p-8 flex-1 flex flex-col">
                  <div className="absolute top-0 right-0 bg-stone-800 text-stone-300 px-4 py-2 rounded-bl-xl font-bold text-sm border-l border-b border-white/10 z-10">
                     規格 {product.code}
                  </div>

                  <div className="mb-4 mt-2">
                    <span className="bg-amber-600 text-stone-950 text-xs font-bold px-3 py-1 rounded-full uppercase shadow-lg inline-block">
                      {product.tag}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">{product.name}</h3>
                  
                  <div className="flex items-baseline gap-2 mb-6">
                     <span className="text-stone-500 line-through">原價 ${product.originalPrice}</span>
                     <span className="text-3xl font-bold text-red-500">特價 ${product.price}</span>
                     <span className="text-sm text-stone-400">/ kg</span>
                  </div>

                  <p className="text-stone-300 font-medium mb-2">
                    {product.description}
                  </p>
                  <p className="text-stone-500 text-sm mb-6 flex-1">
                    {product.detail}
                  </p>
                  
                  <button 
                    onClick={() => scrollToSection('contact')}
                    className="w-full py-3 bg-stone-800 text-white hover:bg-amber-600 hover:text-stone-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    選擇此規格 <span className="text-lg">→</span>
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
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">10分鐘好菜上桌</h2>
            <p className="text-stone-400">
              醬汁已調味，簡單加熱即可還原炭烤美味。
            </p>
            <p className="text-stone-500 text-xs mt-2">* 每台機器功率不同，時間僅供參考</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-stone-950 p-6 rounded-xl border border-white/5 text-center group hover:border-amber-500/50 transition-colors">
               <div className="w-16 h-16 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500 group-hover:scale-110 transition-transform">
                 <Utensils size={32} />
               </div>
               <h3 className="text-white font-bold mb-2">微波加熱</h3>
               <p className="text-stone-400 text-sm">退冰、需拆袋<br/>3 - 5 分鐘</p>
            </div>
            
            <div className="bg-stone-950 p-6 rounded-xl border border-white/5 text-center group hover:border-amber-500/50 transition-colors">
               <div className="w-16 h-16 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500 group-hover:scale-110 transition-transform">
                 <Flame size={32} />
               </div>
               <h3 className="text-white font-bold mb-2">烤箱加熱</h3>
               <p className="text-stone-400 text-sm">退冰、需拆袋<br/>10 - 15 分鐘<br/><span className="text-xs text-amber-500/80">小心烤焦！</span></p>
            </div>

            <div className="bg-stone-950 p-6 rounded-xl border border-white/5 text-center group hover:border-amber-500/50 transition-colors">
               <div className="w-16 h-16 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500 group-hover:scale-110 transition-transform">
                 <Clock size={32} />
               </div>
               <h3 className="text-white font-bold mb-2">氣炸鍋</h3>
               <p className="text-stone-400 text-sm">退冰、需拆袋<br/>160度 8 分鐘</p>
            </div>

            <div className="bg-stone-950 p-6 rounded-xl border border-white/5 text-center group hover:border-amber-500/50 transition-colors">
               <div className="w-16 h-16 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500 group-hover:scale-110 transition-transform">
                 <CheckCircle size={32} />
               </div>
               <h3 className="text-white font-bold mb-2">隔水加熱</h3>
               <p className="text-stone-400 text-sm">無需退冰拆袋<br/>3 - 5 分鐘</p>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: FAQ & Policy Section (Added as requested) */}
      <section id="faq" className="py-20 bg-stone-900 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-2">
              <HelpCircle className="text-amber-500" /> 常見問題與購物須知
            </h2>
            <p className="text-stone-400">
              關於配送、保存與退換貨的相關說明，讓您買得更安心。
            </p>
          </div>

          <div className="space-y-6">
            {FAQS.map((faq, index) => (
              <div key={index} className="bg-stone-950 rounded-xl border border-white/10 overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-amber-500 mb-3 flex items-start gap-2">
                    <span className="mt-1"><ChevronRight size={16} /></span>
                    {faq.question}
                  </h3>
                  <p className="text-stone-300 pl-6 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Order Section */}
      <section id="contact" className="py-24 bg-stone-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-amber-600/5 skew-x-12 transform translate-x-1/4"></div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            
            {/* Information Column */}
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold text-white mb-4">立即預訂美味</h2>
                <p className="text-stone-400 text-lg">
                  請填寫右側表單進行訂購。我們收到訂單後，將會有專人與您確認出貨時間。
                </p>
              </div>

              <div className="bg-stone-900 rounded-xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                   <Truck className="text-amber-500" /> 冷凍宅配運費說明
                </h3>
                <ul className="space-y-3 text-stone-300">
                   <li className="flex justify-between border-b border-white/5 pb-2">
                      <span>2 公斤以下</span>
                      <span className="font-bold text-white">$225</span>
                   </li>
                   <li className="flex justify-between border-b border-white/5 pb-2">
                      <span>3 ~ 4 公斤</span>
                      <span className="font-bold text-white">$290</span>
                   </li>
                   <li className="flex justify-between items-center">
                      <span>5 公斤以上</span>
                      <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">免運費</span>
                   </li>
                </ul>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-stone-900 p-3 rounded-lg text-amber-500">
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">訂購備註</h3>
                    <p className="text-stone-400">
                      填單時請務必註明：<br/>
                      1. 收件人姓名、地址<br/>
                      2. 期待到貨日及時間<br/>
                      3. 購買規格 (A/B/C)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Form Link Area (New Window) */}
            <div className="bg-stone-900 p-1 rounded-2xl shadow-2xl border border-white/10 h-full flex items-center">
              <div className="bg-white w-full h-[500px] md:h-auto rounded-xl overflow-hidden relative flex flex-col items-center justify-center text-center p-10 py-20">
                
                <div className="mb-6 bg-amber-100 p-5 rounded-full text-amber-600 animate-bounce-slow">
                  <ShoppingBag size={56} />
                </div>
                <h3 className="text-stone-900 text-3xl font-bold mb-4">準備好訂購了嗎？</h3>
                <p className="text-stone-600 mb-8 max-w-sm text-lg leading-relaxed">
                  點擊下方按鈕將開啟 Google 訂購表單 (另開視窗)。<br/>填寫完畢後，我們將寄送確認信給您。
                </p>
                
                <a 
                  href="https://docs.google.com/forms/d/1W9iyrVFahsreK_HU9wabdsL2WUhg054upirHDNxqVBA/viewform" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-10 py-5 bg-amber-600 text-stone-950 font-bold text-xl rounded-xl shadow-lg hover:bg-amber-500 hover:scale-105 transition-all w-full sm:w-auto flex items-center justify-center gap-3 group"
                >
                  前往填寫訂購單 <ExternalLink size={20} className="group-hover:translate-x-1 transition-transform"/>
                </a>
              
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-950 py-12 border-t border-white/10 text-center">
        {/* Contact Info added here */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 mb-6 text-stone-400">
          <p className="flex items-center gap-2">
             <Phone size={16} className="text-amber-500" />
             <span>電話：(待更新)</span>
          </p>
          <p className="flex items-center gap-2">
             <MapPin size={16} className="text-amber-500" />
             <span>地址：(待更新)</span>
          </p>
        </div>

        <p className="text-stone-500 text-sm">
          &copy; 2026 興旺蒲燒鰻. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default App;