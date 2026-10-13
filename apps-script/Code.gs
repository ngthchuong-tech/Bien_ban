/**
 * BIÊN BẢN KSNB — máy chủ (Google Apps Script + Google Sheet)
 *
 * Cách dùng: xem README.md. Tóm tắt:
 *  1. Tạo một Google Sheet mới, mở Tiện ích mở rộng > Apps Script, dán file này vào.
 *  2. Chạy hàm setup() một lần (cấp quyền), rồi xem mã PIN trong Nhật ký thực thi.
 *  3. Triển khai: Triển khai > Ứng dụng web > Thực thi với quyền "Tôi", truy cập "Bất kỳ ai".
 */

const SHEET_BB = 'BienBan';   // mỗi biên bản một dòng
const SHEET_PB = 'PhienBan';  // mỗi lần lưu một dòng (chỉ thêm, không sửa/xóa)
const SHEET_NS = 'NhanSu';    // danh bạ nhân sự
const SHEET_DM = 'DanhMuc';   // danh mục cài sẵn theo từng cảng (mỗi cảng một dòng)

const HEADERS = {
  BienBan: ['id', 'loai', 'tieuDe', 'donVi', 'trangThai', 'phienBanHienTai', 'ngayTao', 'capNhat', 'nguoiLap'],
  PhienBan: ['id', 'bienBanId', 'soPhienBan', 'thoiDiem', 'nguoiLuu', 'trangThai', 'dulieu'],
  NhanSu: ['donVi', 'hoTen', 'chucDanh', 'ghiChu'],
  DanhMuc: ['cang', 'duLieu', 'capNhat']
};

// Giới hạn một ô của Google Sheet khoảng 50.000 ký tự; để dư một chút
const MAX_CELL = 49000;

/* ------------------------------------------------------------
 * CÀI ĐẶT (chạy một lần)
 * ------------------------------------------------------------ */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(HEADERS).forEach(name => ensureSheet_(ss, name, HEADERS[name]));
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('PIN')) {
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    props.setProperty('PIN', pin);
    Logger.log('MÃ PIN của bạn: ' + pin + '  (ghi lại, nhập vào trang web khi đăng nhập)');
  } else {
    Logger.log('Đã có PIN. Muốn đổi PIN, chạy hàm doiPin("mã mới").');
  }
}

// Đổi PIN: sửa chuỗi bên trong rồi chạy hàm này trong trình soạn
function doiPin() {
  const moi = 'NHAP_PIN_MOI_VAO_DAY'; // sửa thành mã PIN mới (6 chữ số) rồi mới chạy
  if (!/^\d{4,}$/.test(moi) || moi.indexOf('NHAP') === 0) throw new Error('Hãy sửa biến moi thành PIN mới trước khi chạy.');
  PropertiesService.getScriptProperties().setProperty('PIN', moi);
  Logger.log('Đã đổi PIN.');
}

function ensureSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

/* ------------------------------------------------------------
 * CỔNG VÀO
 * ------------------------------------------------------------ */
function doGet() {
  return json_({ ok: true, data: { service: 'ksnb-bienban', version: 1 } });
}

function doPost(e) {
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    kiemTraPin_(req.pin);
    const data = route_(req.action, req.payload || {});
    return json_({ ok: true, data: data });
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}

function kiemTraPin_(pin) {
  const dung = PropertiesService.getScriptProperties().getProperty('PIN');
  if (!dung) throw new Error('Chưa cài đặt: chạy hàm setup() trước.');
  if (String(pin || '') !== dung) throw new Error('Sai mã PIN.');
}

function route_(action, p) {
  switch (action) {
    case 'ping':            return { thoiDiem: new Date().toISOString() };
    case 'listBienBan':     return listBienBan_(p);
    case 'getBienBan':      return getBienBan_(p.id);
    case 'getPhienBan':     return getPhienBan_(p.id, p.soPhienBan);
    case 'saveVersion':     return saveVersion_(p);
    case 'getRoster':       return getRoster_();
    case 'saveRoster':      return saveRoster_(p.rows || []);
    case 'getDanhMuc':      return getDanhMuc_();
    case 'saveDanhMuc':     return saveDanhMuc_(p.cang, p.settings);
    default: throw new Error('Hành động không hợp lệ: ' + action);
  }
}

/* ------------------------------------------------------------
 * ĐỌC / GHI BẢNG
 * ------------------------------------------------------------ */
function docBang_(name) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) throw new Error('Thiếu sheet ' + name + ': chạy setup() trước.');
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return { sheet: sh, headers: values[0] || [], rows: [] };
  const headers = values[0];
  const rows = values.slice(1).map((r, i) => {
    const o = { _dong: i + 2 };
    headers.forEach((h, j) => o[h] = r[j]);
    return o;
  });
  return { sheet: sh, headers: headers, rows: rows };
}

function themDong_(sheet, headers, obj) {
  sheet.appendRow(headers.map(h => obj[h] === undefined ? '' : obj[h]));
}

/* ------------------------------------------------------------
 * BIÊN BẢN
 * ------------------------------------------------------------ */
function listBienBan_(p) {
  const { rows } = docBang_(SHEET_BB);
  let ds = rows.filter(r => r.id);
  if (p && p.donVi) ds = ds.filter(r => String(r.donVi) === String(p.donVi));
  if (p && p.trangThai) ds = ds.filter(r => String(r.trangThai) === String(p.trangThai));
  ds.sort((a, b) => String(b.capNhat).localeCompare(String(a.capNhat)));
  return ds.map(r => ({
    id: r.id, loai: r.loai, tieuDe: r.tieuDe, donVi: r.donVi,
    trangThai: r.trangThai, phienBanHienTai: r.phienBanHienTai,
    ngayTao: r.ngayTao, capNhat: r.capNhat, nguoiLap: r.nguoiLap
  }));
}

function getBienBan_(id) {
  const bb = timBienBan_(id);
  const ver = getPhienBan_(id, bb.phienBanHienTai);
  return { bienBan: bb, phienBan: ver, lichSu: lichSuPhienBan_(id) };
}

function lichSuPhienBan_(id) {
  const { rows } = docBang_(SHEET_PB);
  return rows
    .filter(r => r.bienBanId === id)
    .map(r => ({ soPhienBan: Number(r.soPhienBan), thoiDiem: r.thoiDiem, nguoiLuu: r.nguoiLuu, trangThai: r.trangThai }))
    .sort((a, b) => b.soPhienBan - a.soPhienBan);
}

function getPhienBan_(id, soPhienBan) {
  const { rows } = docBang_(SHEET_PB);
  const r = rows.find(x => x.bienBanId === id && Number(x.soPhienBan) === Number(soPhienBan));
  if (!r) throw new Error('Không tìm thấy phiên bản ' + soPhienBan);
  return {
    soPhienBan: Number(r.soPhienBan), thoiDiem: r.thoiDiem,
    nguoiLuu: r.nguoiLuu, trangThai: r.trangThai,
    dulieu: JSON.parse(r.dulieu)
  };
}

function timBienBan_(id) {
  const { rows } = docBang_(SHEET_BB);
  const r = rows.find(x => x.id === id);
  if (!r) throw new Error('Không tìm thấy biên bản ' + id);
  return r;
}

/**
 * Lưu một phiên bản.
 * - Không có id: tạo biên bản mới (phiên bản 1).
 * - Có id: thêm phiên bản mới vào lịch sử, KHÔNG ghi đè bản cũ.
 */
function saveVersion_(p) {
  const json = JSON.stringify(p.data || {});
  if (json.length > MAX_CELL) throw new Error('Biên bản quá dài so với giới hạn một ô của Sheet.');

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const now = new Date().toISOString();
    const bbSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_BB);
    const pbSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PB);
    const bbHeaders = HEADERS.BienBan, pbHeaders = HEADERS.PhienBan;

    let id = p.id, so = 1, ngayTao = now;
    if (id) {
      const bb = timBienBan_(id);
      so = Number(bb.phienBanHienTai) + 1;
      ngayTao = bb.ngayTao;
      // cập nhật dòng biên bản
      bbSheet.getRange(bb._dong, 1, 1, bbHeaders.length).setValues([[
        id, p.loai || bb.loai, p.tieuDe || bb.tieuDe, p.donVi || bb.donVi,
        p.trangThai || bb.trangThai, so, ngayTao, now, p.nguoiLap || bb.nguoiLap
      ]]);
    } else {
      id = Utilities.getUuid();
      themDong_(bbSheet, bbHeaders, {
        id: id, loai: p.loai || '', tieuDe: p.tieuDe || '', donVi: p.donVi || '',
        trangThai: p.trangThai || 'nháp', phienBanHienTai: 1,
        ngayTao: now, capNhat: now, nguoiLap: p.nguoiLap || ''
      });
    }

    themDong_(pbSheet, pbHeaders, {
      id: Utilities.getUuid(), bienBanId: id, soPhienBan: so, thoiDiem: now,
      nguoiLuu: p.nguoiLap || '', trangThai: p.trangThai || 'nháp', dulieu: json
    });
    return { id: id, soPhienBan: so, thoiDiem: now };
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------------------------------------
 * DANH BẠ NHÂN SỰ
 * ------------------------------------------------------------ */
function getRoster_() {
  const { rows } = docBang_(SHEET_NS);
  return rows.filter(r => r.hoTen).map(r => ({
    donVi: r.donVi, hoTen: r.hoTen, chucDanh: r.chucDanh, ghiChu: r.ghiChu
  }));
}

function saveRoster_(rows) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NS);
    const h = HEADERS.NhanSu;
    sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), h.length).clearContent();
    const data = rows
      .filter(r => r && r.hoTen)
      .map(r => [r.donVi || '', r.hoTen || '', r.chucDanh || '', r.ghiChu || '']);
    if (data.length) sh.getRange(2, 1, data.length, h.length).setValues(data);
    return { soDong: data.length };
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------------------------------------
 * DANH MỤC CÀI SẴN (theo cảng)
 * ------------------------------------------------------------ */
function getDanhMuc_() {
  const { rows } = docBang_(SHEET_DM);
  const out = {};
  rows.filter(r => r.cang).forEach(r => {
    try { out[String(r.cang)] = JSON.parse(r.duLieu); } catch (e) { /* bỏ qua dòng hỏng */ }
  });
  return out;
}

function saveDanhMuc_(cang, settings) {
  if (!cang) throw new Error('Thiếu tên cảng.');
  const json = JSON.stringify(settings || {});
  if (json.length > MAX_CELL) throw new Error('Danh mục quá dài cho một ô của Sheet.');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_DM);
    const { rows } = docBang_(SHEET_DM);
    const now = new Date().toISOString();
    const hit = rows.find(r => String(r.cang) === String(cang));
    if (hit) {
      sh.getRange(hit._dong, 1, 1, 3).setValues([[cang, json, now]]);
    } else {
      themDong_(sh, HEADERS.DanhMuc, { cang: cang, duLieu: json, capNhat: now });
    }
    return { cang: cang, capNhat: now };
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------------------------------------ */
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
