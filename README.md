# Lập biên bản KSNB

Trang web lập biên bản kiểm tra của Ban KSNB Cảng Đồng Nai. Biên bản và các phiên bản đã lưu nằm trong Google Sheet; trang web chạy trên GitHub Pages.

## Cấu trúc

- `docs/index.html` — trang lập biên bản (GitHub Pages đọc thư mục này).
- `apps-script/Code.gs` — máy chủ: ghi và đọc Google Sheet (dán vào Apps Script).

## Cài đặt (làm một lần)

### 1. Tạo Google Sheet và máy chủ
1. Tạo một Google Sheet mới (ví dụ tên "Biên bản KSNB").
2. Trong Sheet, vào **Tiện ích mở rộng > Apps Script**.
3. Xóa nội dung mặc định, dán toàn bộ file `apps-script/Code.gs`, bấm lưu.
4. Chọn hàm **setup** trên thanh công cụ rồi bấm **Chạy**. Cấp quyền khi được hỏi.
5. Vào **Nhật ký thực thi** (Execution log) để xem **mã PIN 6 chữ số**. Ghi lại mã này.

### 2. Triển khai thành web app
1. Bấm **Triển khai > Tạo lượt triển khai mới**.
2. Loại: **Ứng dụng web**. Thực thi với: **Tôi**. Ai có quyền truy cập: **Bất kỳ ai**.
3. Bấm **Triển khai**, sao chép địa chỉ kết thúc bằng `/exec`.

Mỗi lần sửa `Code.gs` phải triển khai lại (Triển khai > Quản lý lượt triển khai > sửa > phiên bản mới), nếu không thay đổi sẽ không có hiệu lực.

### 3. Bật GitHub Pages
1. Vào repo trên GitHub, chọn **Settings > Pages**.
2. Source: **Deploy from a branch**. Branch: **main**, thư mục: **/docs**. Bấm Save.
3. Sau vài phút trang sẽ chạy tại: `https://ngthchuong-tech.github.io/Bien_ban/`

### 4. Nhập cài đặt vào trang
1. Mở trang, vào **Cài đặt**.
2. Dán địa chỉ `/exec`, nhập mã PIN, nhập tên người lập biên bản.
3. Bấm **Kiểm tra kết nối**. Nếu báo "Kết nối được" là xong.

Cài đặt chỉ lưu trên trình duyệt của máy đó. Khi dùng máy khác phải nhập lại.

### 5. Nhập danh bạ
Vào **Danh bạ**, dán danh sách (mỗi dòng: `Đơn vị | Họ và tên | Chức danh`, copy từ Excel cũng được), rồi bấm **Lưu danh bạ lên máy chủ**. Khi lập biên bản, gõ tên người sẽ có gợi ý và chức danh tự điền.

## Cách dùng hằng ngày

- **Biên bản mới**: bấm **Mới**, nhập thông tin, tích chọn và gõ nội dung. Phần xem trước bên phải là bản sẽ in.
- **Lưu**: bấm **Lưu phiên bản**. Mỗi lần lưu tạo thêm một phiên bản, bản cũ không bị mất.
- **Sửa biên bản cũ**: vào **Danh sách**, bấm **Mở**. Muốn lấy một biên bản cũ làm mẫu cho bản mới, bấm **Làm mẫu**.
- **In / PDF**: bấm **In / PDF**, chọn máy in hoặc "Lưu dưới dạng PDF".
- **Nháp**: trang tự lưu nháp trên máy mỗi khi nhập. Nếu đóng nhầm hoặc mất mạng, mở lại sẽ có nháp để tiếp tục.

## Lưu ý bảo mật
- Repo này **công khai**, nên không đưa mã PIN, địa chỉ `/exec` hoặc dữ liệu biên bản vào code.
- Dữ liệu biên bản chỉ nằm trong Google Sheet của bạn. Chỉ người có PIN mới ghi/đọc được.
- Muốn đổi PIN: sửa biến `moi` trong hàm `doiPin()` rồi chạy hàm đó.

## Việc chưa có (v2)
- Xuất file Word (.docx).
- Nhiều người cùng dùng với tài khoản riêng.
