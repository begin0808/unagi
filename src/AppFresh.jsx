import React, { useState, useEffect } from 'react';
import { ShoppingBag, ChevronDown, Star, MessageCircle, MapPin, Phone, Instagram, Facebook, Clock, CheckCircle, Award, Heart, ShieldCheck, Megaphone, Calendar, Flame, Truck, Utensils, ExternalLink, Anchor } from 'lucide-react';

// 產品資料 (內容不變)
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

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.title = "興旺蒲燒鰻 - 來自大海的鮮甜";
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 font-sans selection:bg-sky-200 selection:text-sky-900">
      {/* Navigation - 清新白底藍字風格 */}
      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('hero')}>
              {/* Logo 改為海洋藍 */}
              <div className="w-10 h-10 bg-sky-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                興
              </div>
              <span className="font-bold text-xl tracking-widest text-slate-800">
                興旺蒲燒鰻
              </span>
            </div>
            
            <div className="hidden md:flex space-x-8">
              <button onClick={() => scrollToSection('news')} className="text-red-500 hover:text-red-600 transition-colors font-bold flex items-center gap-1">
                <Megaphone size={16} /> 最新消息
              </button>
              <button onClick={() => scrollToSection('products')} className="text-slate-600 hover:text-sky-600 transition-colors font-medium">嚴選商品</button>
              <button onClick={() => scrollToSection('cooking')} className="text-slate-600 hover:text-sky-600 transition-colors font-medium">美味秘訣</button>
              <button onClick={() => scrollToSection('contact')} className="px-5 py-2 bg-sky-600 text-white font-bold rounded-full hover:bg-sky-500 transition-all shadow-lg hover:shadow-sky-200 flex items-center gap-2">
                <ShoppingBag size={18} />
                立即訂購
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600 hover:text-sky-600">
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
          <div className="md:hidden bg-white border-b border-sky-100 shadow-xl">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <button onClick={() => scrollToSection('news')} className="block px-3 py-2 text-base font-bold text-red-500 w-full text-left">🔥 最新消息</button>
              <button onClick={() => scrollToSection('products')} className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-sky-600 w-full text-left">嚴選商品</button>
              <button onClick={() => scrollToSection('cooking')} className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-sky-600 w-full text-left">美味秘訣</button>
              <button onClick={() => scrollToSection('contact')} className="block px-3 py-2 text-base font-bold text-sky-600 w-full text-left">前往訂購</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - 藍天風格 */}
      <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* 覆蓋層改為清透的藍色漸層 */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-900/30 via-slate-900/10 to-slate-50 z-10"></div>
          
          {/* 建議：這裡可以使用比較明亮的圖片，或者保留原本的圖片但 Overlay 變亮 */}
          <img 
            src="./images/hero-bg-new.jpg" 
            alt="Grilled Eel Hero Background" 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://images.unsplash.com/photo-1605333146460-e448b5980753?q=80&w=2000&auto=format&fit=crop"; 
            }}
          />
        </div>

        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto mt-16">
          <div className="inline-block px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/40 mb-4">
            <h2 className="text-white font-bold tracking-[0.2em] text-lg md:text-xl drop-shadow-md">
              鹿港在地・外銷日本 No.1
            </h2>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-wider leading-tight drop-shadow-lg">
            【興旺】蒲燒鰻<br/>
            <span className="text-sky-300 text-4xl md:text-6xl drop-shadow-md">頂級品質 最佳嚴選</span>
          </h1>
          <p className="text-white text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed font-medium drop-shadow-md bg-black/10 p-4 rounded-lg backdrop-blur-sm">
            榮獲日本電視台跨海採訪殊榮。<br/>
            深海魚粉飼養的極致美味，將這份外銷日本的驕傲留在台灣。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => scrollToSection('news')}
              className="px-8 py-4 bg-red-600 text-white text-lg font-bold rounded-full hover:bg-red-500 hover:scale-105 transition-all shadow-xl hover:shadow-red-200 flex items-center justify-center gap-2"
            >
              <Megaphone size={20} /> 看年節優惠
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="px-8 py-4 bg-white text-sky-700 text-lg font-bold rounded-full hover:bg-sky-50 hover:scale-105 transition-all shadow-xl hover:shadow-sky-100"
            >
              立即預訂
            </button>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-slate-400">
          <ChevronDown size={32} />
        </div>
      </section>

      {/* Latest News - 清新紅/白配色 */}
      <section id="news" className="py-20 bg-white relative overflow-hidden">
        {/* 背景裝飾：淡藍色波浪 */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-50 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute top-40 -left-20 w-72 h-72 bg-blue-50 rounded-full blur-3xl opacity-60"></div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-5 py-2 rounded-full text-sm font-bold mb-8 border border-red-100 shadow-sm">
            <span className="animate-pulse">🔥</span> 最新消息・年節限定
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-slate-800 mb-6 leading-tight">
            年菜少不了這一道！<br/>
            <span className="text-sky-600">團圓秒殺・必吃蒲燒鰻</span>
          </h2>
          
          <p className="text-xl text-slate-500 mb-10 font-medium leading-relaxed">
            💕 冷凍庫必囤美食！美味又營養，<br className="md:hidden"/>料理超方便，<span className="text-sky-600 font-bold">10分鐘好菜上桌！</span> 💕
          </p>

          <div className="bg-white p-8 md:p-10 rounded-3xl border border-sky-100 shadow-[0_10px_40px_-15px_rgba(14,165,233,0.15)] transform transition-all hover:scale-[1.01]">
            <div className="bg-gradient-to-r from-red-500 to-rose-500 p-6 rounded-2xl shadow-lg mb-10 relative overflow-hidden text-white">
               <div className="absolute top-0 right-0 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-bl-lg">限時優惠</div>
               <h3 className="text-2xl md:text-3xl font-bold mb-4 flex items-center justify-center gap-2">
                 <span className="text-yellow-300">🧧</span> 過年大降價 <span className="text-yellow-300">🧧</span>
               </h3>
               <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">
                  <span className="text-red-100 line-through text-lg md:text-xl">原價 $1300/kg</span>
                  <div className="flex items-baseline gap-1 bg-white/20 px-4 py-1 rounded-lg backdrop-blur-sm">
                    <span className="text-4xl md:text-5xl font-bold text-white">特價 $1200</span>
                    <span className="text-xl text-white/90">/ 一公斤</span>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="flex flex-col items-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-slate-400 text-sm mb-2 flex items-center gap-2">
                   <Clock size={16} /> 結單時間
                </div>
                <div className="text-2xl font-bold text-slate-800">112/1/3 (二)</div>
                <div className="text-red-500 font-bold mt-1 text-sm bg-red-50 px-2 py-0.5 rounded">上午 11:00 準時結單</div>
              </div>
              <div className="flex flex-col items-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                 <div className="text-slate-400 text-sm mb-2 flex items-center gap-2">
                   <Calendar size={16} /> 預計到貨
                 </div>
                 <div className="text-2xl font-bold text-slate-800">1/5 (四)</div>
                 <div className="text-green-600 font-bold mt-1 text-sm bg-green-50 px-2 py-0.5 rounded">貨到通知</div>
              </div>
            </div>

            <button 
              onClick={() => scrollToSection('contact')}
              className="w-full md:w-auto px-12 py-5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xl rounded-full shadow-lg hover:shadow-sky-200 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 mx-auto"
            >
              <ShoppingBag size={24} />
              立即搶購年菜
            </button>
            <p className="mt-4 text-slate-400 text-sm">數量有限，售完為止</p>
          </div>
        </div>
      </section>

      {/* Story Section - 清爽白底 */}
      <section id="story" className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 text-sky-600 font-bold tracking-widest uppercase border-b-2 border-sky-200 pb-2">
                <Anchor size={20} /> 品牌故事
              </div>
              <h2 className="text-4xl font-bold text-slate-800 leading-snug">
                來自彰化鹿港，<br/>長年外銷東京的隱形冠軍。
              </h2>
              <div className="text-slate-600 text-lg leading-relaxed space-y-6">
                <p>
                  <strong className="text-sky-700">興旺蒲燒鰻</strong>，在地養殖三十餘年。這是一份原本只獻給日本頂級餐桌的美味，長年來是外銷日本東京第一名的品質保證。
                </p>
                <p>
                  我們的品質之高，甚至迎來<strong className="text-sky-600">日本電視台跨海採訪</strong>之殊榮。適逢大環境變遷，我們決定將這份珍貴的美味留在台灣，讓家鄉的好朋友也能品嚐到這份「小農推薦、品質 No.1」的日本鰻。
                </p>
                <p>
                  高級日本料理，現在在家就能速上桌。這不僅是一次難得的內銷機會，更是我們對台灣這片土地的回饋。
                </p>
              </div>
              
              <div className="pt-6">
                <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                   <div className="bg-sky-50 p-3 rounded-full text-sky-600">
                     <Award size={32} />
                   </div>
                   <div>
                     <h4 className="text-slate-800 font-bold text-lg">日本電視台跨海採訪</h4>
                     <p className="text-slate-500 text-sm">品質備受國際肯定的極致殊榮</p>
                   </div>
                </div>
              </div>
            </div>
            
            {/* Brand Story Image */}
            <div className="relative mt-8 md:mt-0">
              <div className="absolute inset-0 border-2 border-sky-200 rounded-2xl transform translate-x-4 translate-y-4"></div>
              <img 
                src="./images/story.jpg" 
                alt="Chef grilling eel" 
                className="relative rounded-2xl shadow-2xl w-full border-4 border-white"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1629239851608-8e8156db6933?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">嚴選商品</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              每一條都經過嚴格挑選。蒲燒鰻冷凍真空包裝，效期兩年，<br/>
              醬汁已經調味好，只需簡單加熱即可美味上桌。
            </p>
            <div className="mt-6 inline-block bg-orange-50 text-orange-700 px-5 py-2 rounded-full border border-orange-200 text-sm font-medium">
               ⚠️ 貼心提醒：偶有細刺請小心！怕刺的人建議選購中型或小型魚。
            </div>
          </div>

          {/* New Image Placeholder Area (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden group shadow-lg">
               <img
                 src="./images/01.jpg"
                 alt="嚴選商品情境圖 1"
                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                 onError={(e) => {
                   e.target.onerror = null;
                   e.target.src = "https://images.unsplash.com/photo-1629239851608-8e8156db6933?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
                 }}
               />
               <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-6">
                 <p className="text-white font-bold text-lg">炭火直烤・香氣四溢</p>
               </div>
            </div>

            <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden group shadow-lg">
               <img
                 src="./images/02.jpg" 
                 alt="嚴選商品情境圖 2"
                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                 onError={(e) => {
                   e.target.onerror = null;
                   e.target.src = "https://images.unsplash.com/photo-1582260656034-7c36a48d8c39?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
                 }}
               />
               <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-6">
                 <p className="text-white font-bold text-lg">真空鎖鮮・加熱即食</p>
               </div>
            </div>
          </div>

          {/* Cards - 白色卡片風格 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PRODUCTS.map((product) => (
              <div key={product.id} className="group bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-sky-200 transition-all duration-300 shadow-lg hover:shadow-2xl flex flex-col relative">
                
                <div className="p-8 flex-1 flex flex-col">
                  {/* Badge */}
                  <div className="absolute top-0 right-0 bg-sky-100 text-sky-800 px-4 py-2 rounded-bl-2xl font-bold text-sm border-l border-b border-sky-50 z-10">
                     規格 {product.code}
                  </div>

                  <div className="mb-4 mt-2">
                    <span className="bg-sky-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase shadow-md inline-block">
                      {product.tag}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">{product.name}</h3>
                  
                  <div className="flex items-baseline gap-2 mb-6">
                     <span className="text-slate-400 line-through">原價 ${product.originalPrice}</span>
                     <span className="text-3xl font-bold text-red-600">特價 ${product.price}</span>
                     <span className="text-sm text-slate-500">/ kg</span>
                  </div>

                  <p className="text-slate-700 font-medium mb-2">
                    {product.description}
                  </p>
                  <p className="text-slate-500 text-sm mb-6 flex-1 border-t border-slate-100 pt-4 mt-2">
                    {product.detail}
                  </p>
                  
                  <button 
                    onClick={() => scrollToSection('contact')}
                    className="w-full py-3 bg-slate-50 text-slate-700 hover:bg-sky-600 hover:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200 hover:border-transparent"
                  >
                    選擇此規格 <span className="text-lg">→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cooking Guide Section - 淡藍色背景區隔 */}
      <section id="cooking" className="py-24 bg-sky-50/50 border-t border-sky-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">10分鐘好菜上桌</h2>
            <p className="text-slate-600">
              醬汁已調味，簡單加熱即可還原炭烤美味。
            </p>
            <p className="text-slate-400 text-xs mt-2">* 每台機器功率不同，時間僅供參考</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Cooking Cards */}
            {[
              { icon: Utensils, title: "微波加熱", desc: "退冰、需拆袋", time: "3 - 5 分鐘" },
              { icon: Flame, title: "烤箱加熱", desc: "退冰、需拆袋", time: "10 - 15 分鐘", warning: "小心烤焦！" },
              { icon: Clock, title: "氣炸鍋", desc: "退冰、需拆袋", time: "160度 8 分鐘" },
              { icon: CheckCircle, title: "隔水加熱", desc: "無需退冰拆袋", time: "3 - 5 分鐘" },
            ].map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl border border-sky-100 text-center group hover:border-sky-300 transition-all shadow-sm hover:shadow-md">
                <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4 text-sky-600 group-hover:scale-110 transition-transform group-hover:bg-sky-600 group-hover:text-white">
                  <item.icon size={32} />
                </div>
                <h3 className="text-slate-800 font-bold mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm">{item.desc}<br/>{item.time}
                  {item.warning && <br/>}
                  {item.warning && <span className="text-xs text-orange-500">{item.warning}</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Order Section */}
      <section id="contact" className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            
            {/* Information Column */}
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold text-slate-800 mb-4">立即預訂美味</h2>
                <p className="text-slate-500 text-lg">
                  請填寫右側表單進行訂購。我們收到訂單後，將會有專人與您確認出貨時間。
                </p>
              </div>

              <div className="bg-sky-50 rounded-2xl p-8 border border-sky-100">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                   <Truck className="text-sky-600" /> 冷凍宅配運費說明
                </h3>
                <ul className="space-y-3 text-slate-600">
                   <li className="flex justify-between border-b border-sky-200 pb-2">
                      <span>2 公斤以下</span>
                      <span className="font-bold text-slate-800">$225</span>
                   </li>
                   <li className="flex justify-between border-b border-sky-200 pb-2">
                      <span>3 ~ 4 公斤</span>
                      <span className="font-bold text-slate-800">$290</span>
                   </li>
                   <li className="flex justify-between items-center pt-2">
                      <span>5 公斤以上</span>
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">免運費</span>
                   </li>
                </ul>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-slate-100 p-3 rounded-full text-slate-500">
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <h3 className="text-slate-800 font-bold text-lg">訂購備註</h3>
                    <p className="text-slate-500">
                      填單時請務必註明：<br/>
                      1. 收件人姓名、地址<br/>
                      2. 期待到貨日及時間<br/>
                      3. 購買規格 (A/B/C)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Form Link Area */}
            <div className="bg-gradient-to-br from-sky-600 to-blue-700 p-1 rounded-3xl shadow-2xl h-full flex items-center transform rotate-1">
              <div className="bg-white w-full h-[500px] md:h-auto rounded-[20px] overflow-hidden relative flex flex-col items-center justify-center text-center p-10 py-20 transform -rotate-1">
                
                <div className="mb-6 bg-sky-100 p-5 rounded-full text-sky-600 animate-bounce-slow">
                  <ShoppingBag size={56} />
                </div>
                <h3 className="text-slate-800 text-3xl font-bold mb-4">準備好訂購了嗎？</h3>
                <p className="text-slate-500 mb-8 max-w-sm text-lg leading-relaxed">
                  點擊下方按鈕將開啟 Google 訂購表單 (另開視窗)。<br/>填寫完畢後，我們將寄送確認信給您。
                </p>
                
                <a 
                  href="https://docs.google.com/forms/d/1W9iyrVFahsreK_HU9wabdsL2WUhg054upirHDNxqVBA/viewform" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-10 py-5 bg-sky-600 text-white font-bold text-xl rounded-full shadow-lg hover:bg-sky-500 hover:scale-105 transition-all w-full sm:w-auto flex items-center justify-center gap-3 group"
                >
                  前往填寫訂購單 <ExternalLink size={20} className="group-hover:translate-x-1 transition-transform"/>
                </a>
              
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 py-12 border-t border-slate-700 text-center text-slate-300">
        <p className="text-sm">
          &copy; 2026 興旺蒲燒鰻. All rights reserved.<br/>
          Designed for STUDIO 0808.
        </p>
      </footer>
    </div>
  );
};

export default App;