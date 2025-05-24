---
mode: 'agent'
---
Bạn hãy viết một đoạn mã JavaScript cho Tampermonkey để hiển thị dữ liệu từ biến `window.dr_data` trong nội dung website bs-noitru.tahospital.vn/?show=true hoặc bs-noitru.tahospital.vn/?nln
- Nghĩa là khi người dùng truy cập vào bs-noitru.tahospital.vn, nếu có "?show=true" trong url, đoạn mã sẽ tự động chạy và hiển thị dữ liệu từ biến `window.dr_data` trên trang web. Nếu chưa có biến `window.dr_data`, hãy chạy hàm để lấy nó ra.
- Đoạn code này sẽ được sử dụng trong Tampermonkey, vì vậy hãy đảm bảo rằng nó tuân thủ các quy tắc và hướng dẫn của Tampermonkey.

Các bước code:
- Check nếu biến `window.dr_data` đã tồn tại hay chưa.
- Nếu chưa tồn tại, hãy chạy hàm để lấy dữ liệu. Hàm nằm ở @file bs-noitru-fetch.js
- Nếu không thể lấy được dữ liệu, có nghĩa là người dùng chưa đăng nhập, hãy hiển thị thông báo "Vui lòng đăng nhập để xem dữ liệu" và chuyển người dùng về trang đăng nhập sau 500ms:
  - https://bs-noitru.tahospital.vn/Home/Login
- Nếu đã tồn tại biến `window.dr_data`, hãy xóa toàn bộ nội dung hiển thị của web và hiển thị dữ liệu đó trên trang web
- Các dữ liệu hiển thị resoponsive, dạng card với các thông tin như sau:
  - Họ tên - Mã bệnh nhân
  - Ngày sinh: tính tuổi từ ngày sinh
  - Giới tính
  - Phòng - giường
  - Chẩn đoán
- Sort danh sách bệnh nhân theo số phòng, nếu trùng số phòng thì sort theo số giường A, B, C...
 + Nếu không phải phòng 214 đến 216 thì card phải có màu xanh
 + Nếu là phòng 214 đến 216 thì card phải có màu trắng
 + Các card phải có viền tròn và shadow nhẹ
- Phía dưới trang hiển thị tổng số bệnh nhân
- Ở mỗi card có nút "Tờ điều trị" với icon hình con mắt nằm ở góc dưới bên phải của card.
- Nếu không có dữ liệu nào thì hiển thị thông báo "Không có dữ liệu" có vẻ như người dùng chưa đăng nhập thì hãy chuyển người dùng về trang đăng nhập.
- Khi người dùng nhấn vào nút "Tờ điều trị" thì mở ra một tab mới với url là https://bs-noitru.tahospital.vn/to-dieu-tri?mabn=[mã bệnh nhân]