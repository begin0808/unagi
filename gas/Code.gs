/**
 * 興旺蒲燒鰻 —— 線上訂購單接收程式（Google Apps Script）
 *
 * 用途：接收網站訂購表單送出的訂單，寫入 Google 試算表，並寄出通知信。
 * 部署方式請見 docs/訂購系統設定說明.md。
 *
 * 安全提醒：金額一律在這裡「重新計算」，不採用瀏覽器傳來的數字，
 * 因為前端的任何數值都能被使用者竄改。
 */

/* ===================== 設定區（可依需要修改） ===================== */

/** 訂單要寫入的工作表名稱，不存在會自動建立 */
const SHEET_NAME = '訂單';

/** 新訂單通知信的收件者；留空字串則自動寄給本指令碼的擁有者 */
const NOTIFY_EMAIL = '';

const SHOP_NAME = '興旺蒲燒鰻';

/** 價格規則，需與網站 src/lib/pricing.ts 保持一致 */
const PRICE_PER_KG = 1000;
const GIFT_BOX_PRICE = 50;

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
  '規格A', '規格B', '規格C', '總公斤', '禮盒數',
  '商品金額', '禮盒金額', '運費', '總金額', '備註', '處理狀態',
];

/* ===================== 主要進入點 ===================== */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json({ ok: false, message: '沒有收到訂單內容' });
    }

    const data = JSON.parse(e.postData.contents);

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
    const boxes = toCount(data.giftBoxes);
    const packs = qa + qb + qc;

    if (!name) return json({ ok: false, message: '缺少收件人姓名' });
    if (!phone) return json({ ok: false, message: '缺少聯絡電話' });
    if (!address) return json({ ok: false, message: '缺少收貨地址' });
    if (packs < 1) return json({ ok: false, message: '訂單數量為 0' });
    if (packs > 200 || boxes > 200) return json({ ok: false, message: '訂單數量異常' });

    // 金額一律由後端重算
    const itemsTotal = packs * PRICE_PER_KG;
    const giftTotal = boxes * GIFT_BOX_PRICE;
    const shipping = shippingFee(packs);
    const total = itemsTotal + giftTotal + shipping;

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
        qa, qb, qc, packs, boxes,
        itemsTotal, giftTotal, shipping, total, note, '待確認',
      ]);
    } finally {
      lock.releaseLock();
    }

    const order = {
      orderNo: orderNo, time: now, name: name, phone: phone, address: address,
      email: email, note: note, qa: qa, qb: qb, qc: qc, packs: packs, boxes: boxes,
      itemsTotal: itemsTotal, giftTotal: giftTotal, shipping: shipping, total: total,
    };

    // 寄信失敗不影響訂單成立
    try { notifyShop_(order); } catch (err) { console.error('通知信寄送失敗：' + err); }
    if (email) {
      try { notifyCustomer_(order); } catch (err) { console.error('客戶確認信寄送失敗：' + err); }
    }

    return json({ ok: true, orderNo: orderNo, total: total });
  } catch (err) {
    console.error(err);
    return json({ ok: false, message: '伺服器處理訂單時發生錯誤' });
  }
}

/** 用瀏覽器直接開啟部署網址時看到的內容，可用來確認部署成功 */
function doGet() {
  return json({ ok: true, service: SHOP_NAME + ' 訂單接收服務', status: 'running' });
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

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    const header = sheet.getRange(1, 1, 1, HEADERS.length);
    header.setFontWeight('bold').setBackground('#1c1917').setFontColor('#fbbf24');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(2, 150); // 訂單時間
    sheet.setColumnWidth(5, 280); // 地址
    sheet.setColumnWidth(16, 220); // 備註
  }
  return sheet;
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
  if (o.boxes) rows.push('送禮禮盒 × ' + o.boxes + '　' + money_(o.giftTotal));
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
    '禮盒金額：' + money_(o.giftTotal),
    '運費（共 ' + o.packs + ' 公斤）：' + (o.shipping === 0 ? '免運費' : money_(o.shipping)),
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
    subject: '【' + SHOP_NAME + '】新訂單 ' + o.orderNo + '　' + o.name + '　' + money_(o.total),
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
 */
function testWrite() {
  const fake = {
    postData: {
      contents: JSON.stringify({
        name: '測試訂單',
        phone: '0912-345-678',
        address: '彰化縣福興鄉測試路 1 號',
        email: '',
        note: '這是一筆測試訂單，確認後請刪除',
        quantities: { A: 1, B: 2, C: 0 },
        giftBoxes: 2,
      }),
    },
  };
  Logger.log(doPost(fake).getContent());
}
