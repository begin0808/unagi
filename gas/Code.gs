/**
 * 興旺蒲燒鰻 —— 線上訂購單接收程式（Google Apps Script）
 *
 * 用途：接收網站訂購表單送出的訂單，寫入 Google 試算表，並寄出通知信。
 * 部署方式請見 docs/訂購系統設定說明.md。
 *
 * 安全提醒：金額與優惠碼一律在這裡驗證與「重新計算」，不採用瀏覽器傳來的數字，
 * 因為前端的任何數值都能被使用者竄改。
 */

/* ===================== 設定區（可依需要修改） ===================== */

/**
 * 訂單試算表的 ID。開啟試算表後看網址列：
 *   https://docs.google.com/spreadsheets/d/【中間這一長串就是 ID】/edit
 * 把那一串貼進下面的引號中。
 *
 * 如果本程式是從試算表的「擴充功能 → Apps Script」建立的，可以留空字串，
 * 程式會自動使用它所屬的那份試算表。
 * 若出現 “You do not have permission to call SpreadsheetApp.getActiveSpreadsheet”
 * 的錯誤，就代表本程式並未綁定試算表，請務必在這裡填入 ID。
 */
const SPREADSHEET_ID = '';

/** 訂單要寫入的工作表名稱，不存在會自動建立 */
const SHEET_NAME = '訂單';

/**
 * 新訂單通知信的收件者。留空字串則自動寄給本指令碼的擁有者。
 *
 * 要寄給多個人時，用「逗號」分隔即可，例如：
 *   const NOTIFY_EMAIL = 'begin0808@gmail.com, someone@gmail.com';
 *
 * 注意：Gmail 免費帳號每天的寄信收件人上限約 100 位。
 * 每筆訂單會寄給「顧客 1 位 + 這裡列的每一位」，
 * 例如這裡填 2 個人，一筆訂單就用掉 3 個額度。
 */
const NOTIFY_EMAIL = '';

const SHOP_NAME = '興旺蒲燒鰻';

/**
 * 收款帳戶 —— 顧客選「銀行轉帳」時，只寫在寄給顧客的訂單確認信裡，網頁畫面不顯示。
 * 這樣一定要填寫真實的 Email 才拿得到帳號，亂填或機器人下的單看不到。
 * 只提供銀行代碼與帳號，不列分行與戶名。
 *
 * 建議直接在 Apps Script 編輯器裡填寫，不要寫進 GitHub 上的 gas/Code.gs。
 * 每次貼上新版程式碼後，記得把這裡重新填回去（跟 SPREADSHEET_ID、NOTIFY_EMAIL 一樣）。
 *
 * account 留空時，確認信會改為「將由專人提供匯款帳號」，不會出現空白或錯誤的帳號。
 */
const BANK_INFO = {
  bankCode: '',   // 銀行代碼（3 碼），例如 '000'
  account: '',    // 帳號（只填數字）
};

/** 轉帳訂單的付款期限（小時），需與網站 src/lib/pricing.ts 的 PAYMENT_DEADLINE_HOURS 一致 */
const PAYMENT_DEADLINE_HOURS = 48;

/** 試算表「處理狀態」欄的下拉選項（「待確認」保留給舊訂單） */
const STATUS_OPTIONS = ['待付款', '待取貨', '已付款', '已出貨', '已完成', '已取消', '待確認'];

/**
 * 優惠碼清單 —— 這是整套系統唯一存放優惠碼與折扣額度的地方。
 *
 * ⚠️ 絕對不要把優惠碼寫進網站的程式碼裡。
 * 網頁原始碼任何人都能打開來看，寫在那裡等於公告週知，
 * 「熟識朋友專屬」就失去意義了。網站只會把客人輸入的碼送來這裡問「對不對」，
 * 驗證通過後才回傳折扣額度給網頁計算，沒有碼的人什麼都看不到。
 *
 * 每一筆的意思是：
 *   codes            這組折扣接受哪些寫法。填成陣列可以設多個別名，
 *                    例如 ['XW50', '荒野'] 兩種寫法都能用（中文碼可以）。
 *   discountPerStep  商品金額每滿 DISCOUNT_STEP_AMOUNT 元，折抵多少。
 *
 * 比對時不分大小寫、自動去除所有空白、全形字自動轉半形，
 * 所以「xw50」「ＸＷ５０」「 XW 50 」都能通過。
 *
 * 要停用優惠碼功能，把陣列清空即可：const PROMO_CODES = [];
 * 要換碼或加碼，改完存檔後記得「部署 → 管理部署作業 → 編輯 → 新版本」。
 */
const PROMO_CODES = [
  { codes: ['XW50'],  discountPerStep: 50 },   // 每滿 1,000 折 50
  { codes: ['XW100'], discountPerStep: 100 },  // 每滿 1,000 折 100
];

/**
 * 折扣以「商品金額」（不含禮盒與運費）每滿這個金額折抵一次，
 * 不足一階的零頭不計，不設上限。每一階折多少由上面各碼自己決定。
 *   XW50 ：1000 → 50、2000 → 100、3000 → 150 ⋯
 *   XW100：1000 → 100、2000 → 200、3000 → 300 ⋯
 */
const DISCOUNT_STEP_AMOUNT = 1000;

/** 價格規則，需與網站 src/lib/pricing.ts 保持一致 */
const PRICE_PER_KG = 1000;

/**
 * 送禮禮盒。每條鰻魚都是單獨真空包裝，一個禮盒約可裝 3~4 條。
 *
 *   免費額度＝購買公斤數
 *   數量上限＝總條數（極端情況一條一盒）
 *   超過免費額度的部分，每個加購 GIFT_BOX_PRICE 元
 *
 * 需與網站 src/lib/pricing.ts 保持一致。
 */
const GIFT_BOX_PRICE = 50;

/** 每個規格一公斤有幾條，用來算總條數 */
const FILLETS_PER_PACK = { A: 3, B: 4, C: 5 };

function freeGiftBoxes(packs) {
  return Math.max(0, packs);
}

function maxGiftBoxes(fillets) {
  return Math.max(0, fillets);
}

const SPEC_NAMES = {
  A: '霸氣大規格（3 條裝 / 1kg）',
  B: '經典人氣款（4 條裝 / 1kg）',
  C: '軟嫩珍稀款（5 條裝 / 1kg）',
};

/** 運費：只看魚的包數（1 包 = 1 公斤），禮盒不計入重量 */
function shippingFee(packs) {
  if (packs <= 0) return 0;
  if (packs <= 2) return 225;
  if (packs <= 4) return 290;
  return 0; // 5 包以上免運
}

const HEADERS = [
  '訂單編號', '訂單時間', '姓名', '電話', '地址', 'Email', 'LINE ID',
  '規格A', '規格B', '規格C', '總公斤', '包裝方式', '禮盒數',
  '商品金額', '禮盒金額', '運費', '優惠碼', '折扣金額',
  '總金額', '取貨方式', '付款方式', '匯款人姓名', '匯款後五碼', '備註', '處理狀態',
];

/* ===================== 主要進入點 ===================== */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json({ ok: false, message: '沒有收到訂單內容' });
    }

    const data = JSON.parse(e.postData.contents);

    // 優惠碼查驗：只回答「有效或無效」，不回傳任何碼的內容
    if (data.action === 'verifyPromo') {
      const found = findPromo_(data.code);
      // 驗證通過才回傳折扣額度；無效時不透露任何資訊
      return found
        ? json({ ok: true, valid: true, discountPerStep: found.discountPerStep })
        : json({ ok: true, valid: false });
    }

    // 蜜罐欄位：真人看不到這個欄位，有填就是機器人。
    // 回傳成功讓對方以為送出了，但不寫入試算表。
    if (data.company) {
      return json({ ok: true, orderNo: '—' });
    }

    const name = String(data.name || '').trim();
    const phone = String(data.phone || '').trim();
    const address = String(data.address || '').trim();
    const email = String(data.email || '').trim();
    const note = String(data.note || '').trim();
    const lineId = String(data.lineId || '').trim().slice(0, 50);

    const q = data.quantities || {};
    const qa = toCount(q.A);
    const qb = toCount(q.B);
    const qc = toCount(q.C);
    const packs = qa + qb + qc;
    const fillets = qa * FILLETS_PER_PACK.A + qb * FILLETS_PER_PACK.B + qc * FILLETS_PER_PACK.C;

    // 包裝方式：只有「送禮」才附禮盒，數量不得超過總條數。
    // 前端已經夾過一次，這裡再夾一次——瀏覽器送來的數字不能採信。
    const packaging = data.packaging === 'gift' ? 'gift' : 'self';
    const boxes = packaging === 'gift'
      ? Math.min(toCount(data.giftBoxes), maxGiftBoxes(fillets))
      : 0;
    const freeBoxes = Math.min(boxes, freeGiftBoxes(packs));
    const extraBoxes = Math.max(0, boxes - freeBoxes);

    // 取貨與付款：付現只限自取／面交，宅配一律轉帳（前端已限制，這裡再擋一次）
    const delivery = data.delivery === 'pickup' ? 'pickup' : 'ship';
    const payment = data.payment === 'cash' && delivery === 'pickup' ? 'cash' : 'transfer';
    // 只留數字；若客人填了整串帳號，取最後五碼
    const last5 = payment === 'transfer' ? String(data.last5 || '').replace(/[^0-9]/g, '').slice(-5) : '';
    const payerName = payment === 'transfer' ? String(data.payerName || '').trim().slice(0, 30) : '';

    if (!name) return json({ ok: false, message: '缺少收件人姓名' });
    if (!phone) return json({ ok: false, message: '缺少聯絡電話' });
    if (delivery === 'ship' && !address) return json({ ok: false, message: '缺少收件地址' });
    // Email 為必填：顧客要靠確認信核對訂單內容，避免到貨後爭議
    if (!email) return json({ ok: false, message: '缺少 Email' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, message: 'Email 格式不正確' });
    if (packs < 1) return json({ ok: false, message: '訂單數量為 0' });
    if (packs > 200) return json({ ok: false, message: '訂單數量異常' });

    // 金額一律由後端重算
    const itemsTotal = packs * PRICE_PER_KG;
    const giftTotal = extraBoxes * GIFT_BOX_PRICE;
    const shipping = delivery === 'pickup' ? 0 : shippingFee(packs); // 自取／面交不經黑貓，免運

    // 優惠碼再驗一次：前端說「已套用」不算數，這裡說了才算
    const promoCode = normalizePromo_(data.promoCode);
    let discount = 0;
    if (promoCode) {
      const promo = findPromo_(promoCode);
      if (!promo) {
        return json({ ok: false, message: '優惠碼不正確或已失效，請重新確認' });
      }
      discount = promoDiscount_(itemsTotal, promo.discountPerStep);
    }

    const total = itemsTotal + giftTotal + shipping - discount;

    // 用鎖避免同時下單時訂單編號重複
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);

    let orderNo;
    let now;
    try {
      const sheet = getSheet_();
      now = new Date();
      orderNo = nextOrderNo_(sheet, now);

      // 電話、LINE ID、後五碼前面加 '，強制以文字存入，避免開頭的 0 被試算表當成數字吃掉
      sheet.appendRow([
        orderNo, now, name, "'" + phone, address, email, lineId ? "'" + lineId : '',
        qa, qb, qc, packs, packaging === 'gift' ? '送禮' : '自用', boxes,
        itemsTotal, giftTotal, shipping, promoCode, discount,
        total,
        delivery === 'pickup' ? '自取／面交' : '宅配',
        payment === 'cash' ? '取貨時付現' : '銀行轉帳',
        payerName,
        last5 ? "'" + last5 : '',
        note,
        payment === 'cash' ? '待取貨' : '待付款',
      ]);
    } finally {
      lock.releaseLock();
    }

    const payDeadline = payment === 'transfer'
      ? Utilities.formatDate(
          new Date(now.getTime() + PAYMENT_DEADLINE_HOURS * 60 * 60 * 1000),
          'Asia/Taipei', 'yyyy/MM/dd HH:mm')
      : '';
    // 帳號只寫在顧客確認信裡，不回傳給網頁；沒設定時信件改為「由專人提供匯款帳號」
    const bank = payment === 'transfer' && BANK_INFO.account ? BANK_INFO : null;

    const order = {
      orderNo: orderNo, time: now, name: name, phone: phone, address: address,
      email: email, lineId: lineId, note: note, qa: qa, qb: qb, qc: qc, packs: packs, boxes: boxes,
      itemsTotal: itemsTotal, packaging: packaging, shipping: shipping,
      freeBoxes: freeBoxes, extraBoxes: extraBoxes, giftTotal: giftTotal,
      promoCode: promoCode, discount: discount, total: total,
      delivery: delivery, payment: payment, payerName: payerName, last5: last5,
      payDeadline: payDeadline, bank: bank,
    };

    // 寄信失敗不影響訂單成立
    try { notifyShop_(order); } catch (err) { console.error('通知信寄送失敗：' + err); }
    if (email) {
      try { notifyCustomer_(order); } catch (err) { console.error('客戶確認信寄送失敗：' + err); }
    }

    return json({
      ok: true, orderNo: orderNo, total: total, discount: discount,
      payment: payment, payDeadline: payDeadline,
      // 只告訴網頁「帳號有沒有寫進確認信」，帳號本身不回傳
      bankInEmail: Boolean(bank),
    });
  } catch (err) {
    console.error(err);
    // 帶出錯誤內容，設定階段比較好判斷問題出在哪
    return json({ ok: false, message: '伺服器處理訂單時發生錯誤：' + (err && err.message ? err.message : err) });
  }
}

/** 用瀏覽器直接開啟部署網址時看到的內容，可用來確認部署成功 */
function doGet() {
  return json({ ok: true, service: SHOP_NAME + ' 訂單接收服務', status: 'running' });
}

/* ===================== 優惠碼 ===================== */

/**
 * 正規化優惠碼，讓客人怎麼打都能通過：
 * 全形轉半形、去掉所有空白（含全形空白）、英文一律轉大寫。
 * 中文字不受影響，所以中文優惠碼也適用。
 */
function normalizePromo_(code) {
  return String(code || '')
    .replace(/[\uFF01-\uFF5E]/g, function (c) {
      return String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
    })
    .replace(/[\s\u3000]/g, '')
    .toUpperCase();
}

/** 找出這組碼對應的折扣設定，找不到回傳 null */
function findPromo_(code) {
  const target = normalizePromo_(code);
  if (!target) return null;
  for (let i = 0; i < PROMO_CODES.length; i++) {
    const entry = PROMO_CODES[i];
    const codes = entry.codes || [];
    for (let j = 0; j < codes.length; j++) {
      if (normalizePromo_(codes[j]) === target) return entry;
    }
  }
  return null;
}

function promoDiscount_(itemsTotal, valuePerStep) {
  if (itemsTotal <= 0 || !valuePerStep) return 0;
  return Math.floor(itemsTotal / DISCOUNT_STEP_AMOUNT) * valuePerStep;
}

/* ===================== 工具函式 ===================== */

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function toCount(v) {
  const n = parseInt(v, 10);
  if (isNaN(n) || n < 0) return 0;
  return n;
}

/** 取得訂單試算表：優先用設定的 ID，其次用本程式所屬的試算表 */
function getSpreadsheet_() {
  if (SPREADSHEET_ID) return SpreadsheetApp.openById(SPREADSHEET_ID);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error(
      '找不到試算表。本程式不是從試算表建立的，請在設定區的 SPREADSHEET_ID 填入試算表 ID。'
    );
  }
  return ss;
}

function getSheet_() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    const header = sheet.getRange(1, 1, 1, HEADERS.length);
    header.setFontWeight('bold').setBackground('#1c1917').setFontColor('#fbbf24');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(2, 150); // 訂單時間
    sheet.setColumnWidth(5, 280); // 地址
    sheet.setColumnWidth(HEADERS.indexOf('備註') + 1, 220);
    applyStatusValidation_(sheet);
    return sheet;
  }

  migratePromoColumns_(sheet);
  migratePackagingColumn_(sheet);
  migratePaymentColumns_(sheet);
  migrateContactColumns_(sheet);
  return sheet;
}

/**
 * 舊版試算表沒有「優惠碼」「折扣金額」兩欄。
 * 這裡在「運費」右邊插入兩欄，既有資料會由 Sheets 自動右移，不會錯位。
 * 已經有這兩欄、或表頭不是預期格式時，什麼都不做。
 */
function migratePromoColumns_(sheet) {
  const width = sheet.getLastColumn();
  if (width < 1) return;

  const header = sheet.getRange(1, 1, 1, width).getValues()[0];
  if (header.indexOf('優惠碼') !== -1) return;

  const feeCol = header.indexOf('運費') + 1; // 轉成 1 起算的欄號
  if (feeCol <= 0) return;

  sheet.insertColumnsAfter(feeCol, 2);
  sheet.getRange(1, feeCol + 1, 1, 2)
    .setValues([['優惠碼', '折扣金額']])
    .setFontWeight('bold')
    .setBackground('#1c1917')
    .setFontColor('#fbbf24');

  // 既有訂單都沒用過優惠碼，折扣補 0
  const rows = sheet.getLastRow() - 1;
  if (rows > 0) {
    const blanks = [];
    for (let i = 0; i < rows; i++) blanks.push(['', 0]);
    sheet.getRange(2, feeCol + 1, rows, 2).setValues(blanks);
  }
}

/**
 * 舊版試算表沒有「包裝方式」欄。
 * 在「禮盒數」左邊插入一欄，既有資料由 Sheets 自動右移，不會錯位。
 * 既有訂單依禮盒數推回包裝方式（有禮盒＝送禮）。
 */
function migratePackagingColumn_(sheet) {
  const width = sheet.getLastColumn();
  if (width < 1) return;

  const header = sheet.getRange(1, 1, 1, width).getValues()[0];
  if (header.indexOf('包裝方式') !== -1) return;

  const boxCol = header.indexOf('禮盒數') + 1;
  if (boxCol <= 0) return;

  sheet.insertColumnsBefore(boxCol, 1);
  sheet.getRange(1, boxCol)
    .setValue('包裝方式')
    .setFontWeight('bold')
    .setBackground('#1c1917')
    .setFontColor('#fbbf24');

  const rows = sheet.getLastRow() - 1;
  if (rows > 0) {
    const boxes = sheet.getRange(2, boxCol + 1, rows, 1).getValues();
    const labels = [];
    for (let i = 0; i < rows; i++) {
      labels.push([Number(boxes[i][0]) > 0 ? '送禮' : '自用']);
    }
    sheet.getRange(2, boxCol, rows, 1).setValues(labels);
  }
}

/**
 * 舊版試算表沒有「取貨方式」「付款方式」「匯款後五碼」三欄。
 * 在「備註」左邊插入三欄，既有資料由 Sheets 自動右移，不會錯位。
 * 既有訂單依地址是否含「自取／面交」推回取貨方式；付款方式留白（當時尚未提供選項）。
 * 同時為「處理狀態」欄加上下拉選單。只會執行一次。
 */
function migratePaymentColumns_(sheet) {
  const width = sheet.getLastColumn();
  if (width < 1) return;

  const header = sheet.getRange(1, 1, 1, width).getValues()[0];
  if (header.indexOf('付款方式') !== -1) return;

  const noteCol = header.indexOf('備註') + 1;
  const addrCol = header.indexOf('地址') + 1; // 地址在備註左邊，插入後欄號不變
  if (noteCol <= 0) return;

  sheet.insertColumnsBefore(noteCol, 3);
  sheet.getRange(1, noteCol, 1, 3)
    .setValues([['取貨方式', '付款方式', '匯款後五碼']])
    .setFontWeight('bold')
    .setBackground('#1c1917')
    .setFontColor('#fbbf24');

  const rows = sheet.getLastRow() - 1;
  if (rows > 0 && addrCol > 0) {
    const addrs = sheet.getRange(2, addrCol, rows, 1).getValues();
    const values = [];
    for (let i = 0; i < rows; i++) {
      values.push([/自取|面交/.test(String(addrs[i][0])) ? '自取／面交' : '宅配', '', '']);
    }
    sheet.getRange(2, noteCol, rows, 3).setValues(values);
  }

  applyStatusValidation_(sheet);
}

/**
 * 舊版試算表沒有「LINE ID」「匯款人姓名」兩欄。
 * LINE ID 插在「Email」右邊，匯款人姓名插在「匯款後五碼」左邊，既有資料由 Sheets 自動右移。
 * 必須在 migratePaymentColumns_ 之後執行（要先有「匯款後五碼」欄）。
 */
function migrateContactColumns_(sheet) {
  const a = insertColumnNextTo_(sheet, 'LINE ID', 'Email', 'after');
  const b = insertColumnNextTo_(sheet, '匯款人姓名', '匯款後五碼', 'before');
  if (a || b) applyStatusValidation_(sheet);
}

/**
 * 表頭沒有 name 這一欄時，在 anchor 欄的左邊（before）或右邊（after）插入一個空白欄。
 * 已經有這一欄、或找不到 anchor 時什麼都不做。有插入時回傳 true。
 */
function insertColumnNextTo_(sheet, name, anchor, side) {
  const width = sheet.getLastColumn();
  if (width < 1) return false;
  const header = sheet.getRange(1, 1, 1, width).getValues()[0];
  if (header.indexOf(name) !== -1) return false;
  const anchorCol = header.indexOf(anchor) + 1;
  if (anchorCol <= 0) return false;

  let col;
  if (side === 'after') {
    sheet.insertColumnsAfter(anchorCol, 1);
    col = anchorCol + 1;
  } else {
    sheet.insertColumnsBefore(anchorCol, 1);
    col = anchorCol;
  }
  sheet.getRange(1, col)
    .setValue(name)
    .setFontWeight('bold')
    .setBackground('#1c1917')
    .setFontColor('#fbbf24');
  return true;
}

/** 「處理狀態」欄改成下拉選單，賣家點選即可更新，不必打字 */
function applyStatusValidation_(sheet) {
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const col = header.indexOf('處理狀態') + 1;
  if (col <= 0) return;
  const rows = sheet.getMaxRows() - 1;
  if (rows <= 0) return;
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_OPTIONS, true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange(2, col, rows, 1).setDataValidation(rule);
}

/** 產生 XW20260906-001 形式的訂單編號 */
function nextOrderNo_(sheet, now) {
  const prefix = 'XW' + Utilities.formatDate(now, 'Asia/Taipei', 'yyyyMMdd');
  const lastRow = sheet.getLastRow();
  let count = 0;

  if (lastRow > 1) {
    const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < values.length; i++) {
      if (String(values[i][0]).indexOf(prefix) === 0) count++;
    }
  }
  return prefix + '-' + ('00' + (count + 1)).slice(-3);
}

function itemLines_(o) {
  const rows = [];
  if (o.qa) rows.push('規格 A ' + SPEC_NAMES.A + ' × ' + o.qa + '　' + money_(o.qa * PRICE_PER_KG));
  if (o.qb) rows.push('規格 B ' + SPEC_NAMES.B + ' × ' + o.qb + '　' + money_(o.qb * PRICE_PER_KG));
  if (o.qc) rows.push('規格 C ' + SPEC_NAMES.C + ' × ' + o.qc + '　' + money_(o.qc * PRICE_PER_KG));
  if (o.boxes) {
    rows.push('送禮禮盒 × ' + o.boxes +
      '（免費 ' + o.freeBoxes + (o.extraBoxes ? '、加購 ' + o.extraBoxes : '') + '）' +
      '　' + (o.giftTotal > 0 ? money_(o.giftTotal) : '免費附贈'));
  }
  return rows.join('\n');
}

function money_(n) {
  // 不依賴 toLocaleString，避免不同執行環境的地區設定差異
  return '$' + String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function orderBody_(o) {
  return [
    '訂單編號：' + o.orderNo,
    '訂單時間：' + Utilities.formatDate(o.time, 'Asia/Taipei', 'yyyy/MM/dd HH:mm'),
    '',
    '【訂購內容】',
    itemLines_(o),
    '',
    '商品金額：' + money_(o.itemsTotal),
    '包裝方式：' + (o.packaging === 'gift'
      ? '送禮（禮盒 ' + o.boxes + ' 個，其中免費 ' + o.freeBoxes +
        (o.extraBoxes ? '、加購 ' + o.extraBoxes + ' 個 ' + money_(o.giftTotal) : '') + '）'
      : '自用（不附禮盒）'),
    o.delivery === 'pickup'
      ? '運費：自取／面交，免運費'
      : '運費（共 ' + o.packs + ' 公斤）：' + (o.shipping === 0 ? '免運費' : money_(o.shipping)),
    o.discount > 0 ? '優惠碼折抵（' + o.promoCode + '）：-' + money_(o.discount) : '',
    '應付總金額：' + money_(o.total),
    '付款方式：' + (o.payment === 'cash'
      ? '取貨時付現'
      : '銀行轉帳' + payerLabel_(o)),
    '',
    '【收件資料】',
    '姓名：' + o.name,
    '電話：' + o.phone,
    '取貨方式：' + (o.delivery === 'pickup' ? '自取／面交' : '黑貓冷凍宅配'),
    o.delivery === 'pickup'
      ? (o.address ? '自取／面交說明：' + o.address : '')
      : '地址：' + o.address,
    o.email ? 'Email：' + o.email : '',
    o.lineId ? 'LINE ID：' + o.lineId : '',
    o.note ? '備註：' + o.note : '',
  ].filter(function (line) { return line !== ''; }).join('\n');
}

/** 「（匯款人 王小明，後五碼 01234）」；兩項都沒填時回傳空字串 */
function payerLabel_(o) {
  const parts = [];
  if (o.payerName) parts.push('匯款人 ' + o.payerName);
  if (o.last5) parts.push('後五碼 ' + o.last5);
  return parts.length ? '（' + parts.join('，') + '）' : '';
}

/** 顧客確認信裡的付款說明 */
function paymentInstructions_(o) {
  if (o.payment === 'cash') {
    return ['【付款資訊】',
      '請於自取／面交時付現 ' + money_(o.total) + '，我們會盡快與您聯繫，約定時間與地點。',
    ].join('\n');
  }
  const lines = ['【付款資訊】'];
  if (o.bank) {
    lines.push('請於 ' + o.payDeadline + ' 前匯款 ' + money_(o.total) + '：');
    if (o.bank.bankCode) lines.push('銀行代碼：' + o.bank.bankCode);
    lines.push('帳號：' + o.bank.account);
  } else {
    lines.push('我們會盡快與您聯繫，提供匯款帳號。請於 ' + o.payDeadline + ' 前匯款 ' + money_(o.total) + '。');
  }
  lines.push(o.payerName || o.last5
    ? '已記錄您的匯款資料' + payerLabel_(o) + '，入帳後我們會依此核對。'
    : '轉帳後請直接回覆本信，告知匯款人姓名或匯款帳號後五碼，方便我們核對。');
  lines.push('確認入帳後即安排出貨。');
  lines.push('');
  lines.push('※ 本店不會以電話或 LINE 通知更改匯款帳號。如收到類似通知，請勿匯款，並直接回覆本信或來電確認。');
  return lines.join('\n');
}

function notifyShop_(o) {
  const to = NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();
  if (!to) return;
  MailApp.sendEmail({
    to: to,
    subject: '【' + SHOP_NAME + '】新訂單 ' + o.orderNo + '　' + o.name + '　' + money_(o.total)
      + (o.payment === 'cash' ? '（取貨付現）' : '（轉帳）')
      + (o.discount > 0 ? '（已用優惠碼）' : ''),
    body: orderBody_(o) + '\n\n—\n本信由訂單系統自動發送。',
  });
}

function notifyCustomer_(o) {
  MailApp.sendEmail({
    to: o.email,
    subject: '【' + SHOP_NAME + '】您的訂單 ' + o.orderNo + ' 已成立',
    body: [
      o.name + ' 您好，',
      '',
      '感謝您訂購 ' + SHOP_NAME + '，我們已收到您的訂單，以下是訂單內容：',
      '',
      orderBody_(o),
      '',
      paymentInstructions_(o),
      '',
      o.boxes > 0
        ? '※ 禮盒會分開包裝、' + (o.delivery === 'pickup' ? '取貨時一併交給您' : '隨同一箱寄出') +
          '，不會預先把鰻魚裝進去（紙盒與冷凍品放在一起容易受潮）。' +
          '\n　 請收到後先將鰻魚冷凍保存，要送禮前再自行裝盒。\n'
        : '',
      '如有任何問題，我們會盡快與您聯繫。',
      '如訂單內容有誤，請直接回覆本信件告知。',
      '',
      SHOP_NAME + '　彰化福興 吳奇清養鰻場',
    ].join('\n'),
  });
}

/* ===================== 測試用 ===================== */

/**
 * 在編輯器選這個函式按「執行」，可以確認試算表寫入與寄信權限都正常。
 * 執行後試算表會多一筆測試訂單，確認完請自行刪除該列。
 *
 * TEST_EMAIL 請填一個您收得到的信箱，用來驗證「顧客確認信」有正常寄出。
 */
const TEST_EMAIL = 'begin0808@gmail.com';

function testWrite() {
  const fake = {
    postData: {
      contents: JSON.stringify({
        name: '測試訂單',
        phone: '0912-345-678',
        address: '臺南市 710 永康區測試路 1 號',
        email: TEST_EMAIL,
        note: '這是一筆測試訂單，確認後請刪除',
        quantities: { A: 1, B: 2, C: 0 },
        packaging: 'gift',
        delivery: 'ship',
        payment: 'transfer',
        lineId: 'test_line',
        payerName: '測試',
        last5: '01234',
        giftBoxes: 2,
        promoCode: PROMO_CODES.length ? PROMO_CODES[0].codes[0] : '',
      }),
    },
  };
  Logger.log(doPost(fake).getContent());
}

/** 單獨測試優惠碼驗證，不會寫入任何資料 */
function testPromo() {
  const check = function (code) {
    const r = doPost({ postData: { contents: JSON.stringify({ action: 'verifyPromo', code: code }) } });
    Logger.log('「' + code + '」→ ' + r.getContent());
  };
  for (let i = 0; i < PROMO_CODES.length; i++) {
    const c = PROMO_CODES[i].codes[0];
    check(c);
    check('  ' + c.toLowerCase() + '  '); // 大小寫與空白應照樣通過
  }
  check('WRONGCODE');
}
