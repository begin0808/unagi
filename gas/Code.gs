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
 * 優惠碼清單 —— 這是整套系統唯一存放優惠碼的地方。
 *
 * ⚠️ 絕對不要把優惠碼寫進網站的程式碼裡。
 * 網頁原始碼任何人都能打開來看，寫在那裡等於公告週知，
 * 「熟識朋友專屬」就失去意義了。網站只會把客人輸入的碼送來這裡問「對不對」。
 *
 * 比對時不分大小寫、自動去除前後空白。
 * 要停用優惠碼功能，把陣列清空即可：const PROMO_CODES = [];
 * 要換碼或加碼，改完存檔後記得「部署 → 管理部署作業 → 編輯 → 新版本」。
 */
const PROMO_CODES = ['XW2026'];

/**
 * 折扣規則：以「商品金額」（不含禮盒與運費）每滿 DISCOUNT_STEP_AMOUNT 元，
 * 折抵 DISCOUNT_STEP_VALUE 元，不足一階的零頭不計，不設上限。
 *   1000 → 折 50、2000 → 折 100、3000 → 折 150、4000 → 折 200 ⋯
 */
const DISCOUNT_STEP_AMOUNT = 1000;
const DISCOUNT_STEP_VALUE = 50;

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
  '訂單編號', '訂單時間', '姓名', '電話', '地址', 'Email',
  '規格A', '規格B', '規格C', '總公斤', '包裝方式', '禮盒數',
  '商品金額', '禮盒金額', '運費', '優惠碼', '折扣金額',
  '總金額', '備註', '處理狀態',
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
      return json({ ok: true, valid: isValidPromo_(data.code) });
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

    if (!name) return json({ ok: false, message: '缺少收件人姓名' });
    if (!phone) return json({ ok: false, message: '缺少聯絡電話' });
    if (!address) return json({ ok: false, message: '缺少收件地址' });
    // Email 為必填：顧客要靠確認信核對訂單內容，避免到貨後爭議
    if (!email) return json({ ok: false, message: '缺少 Email' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, message: 'Email 格式不正確' });
    if (packs < 1) return json({ ok: false, message: '訂單數量為 0' });
    if (packs > 200) return json({ ok: false, message: '訂單數量異常' });

    // 金額一律由後端重算
    const itemsTotal = packs * PRICE_PER_KG;
    const giftTotal = extraBoxes * GIFT_BOX_PRICE;
    const shipping = shippingFee(packs);

    // 優惠碼再驗一次：前端說「已套用」不算數，這裡說了才算
    const promoCode = normalizePromo_(data.promoCode);
    let discount = 0;
    if (promoCode) {
      if (!isValidPromo_(promoCode)) {
        return json({ ok: false, message: '優惠碼不正確或已失效，請重新確認' });
      }
      discount = promoDiscount_(itemsTotal);
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

      sheet.appendRow([
        orderNo, now, name, phone, address, email,
        qa, qb, qc, packs, packaging === 'gift' ? '送禮' : '自用', boxes,
        itemsTotal, giftTotal, shipping, promoCode, discount,
        total, note, '待確認',
      ]);
    } finally {
      lock.releaseLock();
    }

    const order = {
      orderNo: orderNo, time: now, name: name, phone: phone, address: address,
      email: email, note: note, qa: qa, qb: qb, qc: qc, packs: packs, boxes: boxes,
      itemsTotal: itemsTotal, packaging: packaging, shipping: shipping,
      freeBoxes: freeBoxes, extraBoxes: extraBoxes, giftTotal: giftTotal,
      promoCode: promoCode, discount: discount, total: total,
    };

    // 寄信失敗不影響訂單成立
    try { notifyShop_(order); } catch (err) { console.error('通知信寄送失敗：' + err); }
    if (email) {
      try { notifyCustomer_(order); } catch (err) { console.error('客戶確認信寄送失敗：' + err); }
    }

    return json({ ok: true, orderNo: orderNo, total: total, discount: discount });
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

function normalizePromo_(code) {
  return String(code || '').trim().toUpperCase();
}

function isValidPromo_(code) {
  const target = normalizePromo_(code);
  if (!target) return false;
  for (let i = 0; i < PROMO_CODES.length; i++) {
    if (normalizePromo_(PROMO_CODES[i]) === target) return true;
  }
  return false;
}

function promoDiscount_(itemsTotal) {
  if (itemsTotal <= 0) return 0;
  return Math.floor(itemsTotal / DISCOUNT_STEP_AMOUNT) * DISCOUNT_STEP_VALUE;
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
    return sheet;
  }

  migratePromoColumns_(sheet);
  migratePackagingColumn_(sheet);
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
    '運費（共 ' + o.packs + ' 公斤）：' + (o.shipping === 0 ? '免運費' : money_(o.shipping)),
    o.discount > 0 ? '優惠碼折抵（' + o.promoCode + '）：-' + money_(o.discount) : '',
    '應付總金額：' + money_(o.total),
    '',
    '【收件資料】',
    '姓名：' + o.name,
    '電話：' + o.phone,
    '地址：' + o.address,
    o.email ? 'Email：' + o.email : '',
    o.note ? '備註：' + o.note : '',
  ].filter(function (line) { return line !== ''; }).join('\n');
}

function notifyShop_(o) {
  const to = NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();
  if (!to) return;
  MailApp.sendEmail({
    to: to,
    subject: '【' + SHOP_NAME + '】新訂單 ' + o.orderNo + '　' + o.name + '　' + money_(o.total)
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
      o.boxes > 0
        ? '※ 禮盒會分開包裝、隨同一箱寄出，不會預先把鰻魚裝進去（紙盒與冷凍品放在一起容易受潮）。' +
          '\n　 請收到後先將鰻魚冷凍保存，要送禮前再自行裝盒。\n'
        : '',
      '我們將盡快由專人與您聯繫確認付款方式與出貨時間。',
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
        giftBoxes: 2,
        promoCode: PROMO_CODES.length ? PROMO_CODES[0] : '',
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
  check(PROMO_CODES.length ? PROMO_CODES[0] : 'NONE');
  check('  ' + (PROMO_CODES.length ? PROMO_CODES[0].toLowerCase() : 'none') + '  '); // 大小寫與空白應照樣通過
  check('WRONGCODE');
}
