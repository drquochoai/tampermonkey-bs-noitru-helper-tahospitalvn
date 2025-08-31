---
mode: agent
---
- Thêm cài đặt trong trang Cài đặt: "settings.js", nhưng phải là một tính năng ở file mới tên là "settings-open-world.js"
- Tạo một file mới tên là "settings-open-world.js" và tích hợp vào "settings.js" như 1 modules.
- Trong file settings-open-world.js phải thực hiện:
1. Các cài đặt tự động lưu khi chỉnh sửa
2. Các cài đặt cần được lưu theo API của riêng tên bác sĩ ở "loadSettingsPhieu(doctorName)" trong file settingsService.js; Chỉ những cài đặt mà người dùng yêu cầu lưu ở localstorage thì mới lưu ở localstorage.
3. tạo một menu bên trái tên là "Thông tin khoa/phòng" ở ".dr-st-menu"
4. Tương ứng với tab "Thông tin khoa/phòng" là nội dung:
4.1 Khoa mặc định tại url "/?nln" là dạng list dọc, được tải xuống từ API: ```fetch("https://bs-noitru.tahospital.vn/ToDieuTri/LoadKhoaPhong", {
  "headers": {
    "accept": "*/*",
    "accept-language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Not;A=Brand\";v=\"99\", \"Google Chrome\";v=\"139\", \"Chromium\";v=\"139\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-requested-with": "XMLHttpRequest"
  },
  "referrer": "https://bs-noitru.tahospital.vn/to-dieu-tri",
  "body": "loaibn=&makp=",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});```
 và respond của nó có dạng kiểu như ví dụ này: ```{"isValid":true,"message":"","data":[{"id":"047","name":"N\u1ED8I TR\u00DA - KHOA UNG B\u01AF\u1EDAU"},{"id":"048","name":"KHOA G\u00C2Y M\u00CA - H\u1ED2I S\u1EE8C"},{"id":"055","name":"TRUNG T\u00C2M CH\u1EA4N TH\u01AF\u01A0NG CH\u1EC8NH H\u00CCNH"},{"id":"057","name":"KHOA N\u1ED8I T\u1ED4NG H\u1EE2P"},{"id":"059","name":"KHOA TI\u1EBET NI\u1EC6U - NAM KHOA"},{"id":"062","name":"KHOA NGO\u1EA0I T\u1ED4NG QU\u00C1T"},{"id":"175","name":"KHOA TIM M\u1EA0CH"},{"id":"365","name":"KHOA N\u1ED8I TH\u1EACN"},{"id":"551","name":"KHOA NGO\u1EA0I L\u1ED2NG NG\u1EF0C - M\u1EA0CH M\u00C1U"}]}```
4.1.1 Khi click vào một khoa/phòng trong danh sách: sẽ mặc định lại localstorage của "bsnt_selected_khoa" với giá trị là id của khoa/phòng được chọn.
4.1.2 Mỗi khi mở trang cài đặt này, Khi load thông tin từ API xong, cũng phải load thông tin của localstorage "bsnt_selected_khoa" và hiển thị dấu tick xanh lá cây để biết là khoa phòng nào đã và đang được chọn.
4.2 Khi khoa/phòng được chọn, sẽ hiển thị Danh sách các phòng bệnh theo dõi bệnh nhân mặc định của khoa được chọn mặc định, mục này là tự động tải về và không thể thay đổi do liên kết trực tiếp với khoa phòng. API của mục này là dạng: ```fetch("https://bs-noitru.tahospital.vn/ToDieuTri/LoadRoom", {
  "headers": {
    "accept": "*/*",
    "accept-language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Not;A=Brand\";v=\"99\", \"Google Chrome\";v=\"139\", \"Chromium\";v=\"139\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-requested-with": "XMLHttpRequest"
  },
  "referrer": "https://bs-noitru.tahospital.vn/to-dieu-tri",
  "body": "code=551",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});``` với code=551, con số 551 là id của khoa; Respond mặc định của API này có dạng ```{"isValid":true,"message":"","data":[{"id":"25967d141744c238e063620a0a0ac01a","code":"P214","name":"Ph\u00F2ng 214","tanG_ID":"e54a6ddf41885d6ae053020a14ac2eb0","khoA_ID":"551"},{"id":"25967d141745c238e063620a0a0ac01a","code":"P215","name":"Ph\u00F2ng 215","tanG_ID":"e54a6ddf41885d6ae053020a14ac2eb0","khoA_ID":"551"},{"id":"25967d141746c238e063620a0a0ac01a","code":"P216","name":"Ph\u00F2ng 216","tanG_ID":"e54a6ddf41885d6ae053020a14ac2eb0","khoA_ID":"551"}]}```
4.2.1 Hiển thị của này là: `name` nhưng lưu data attribute các thông số còn lại.
4.2.2. Các phòng này rất quan trọng trong việc load danh sách bệnh nhân ở dashboard ban đầu, vì vậy cần phải hiển thị toàn bộ danh sách bệnh nhân ở các phòng trong khoa. Hiện tại dashboard đang hiển thị các bệnh nhân của khoa, nhưng một số bệnh nhân nằm khoa khác gửi bệnh tại khoa default thì không thể hiển thị trong dashboard, do đó các phòng này cần phải được load ban đầu ở dashboard luôn. API của nó thuộc dạng: ```fetch("https://bs-noitru.tahospital.vn/ToDieuTri/Search", {
  "headers": {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9,vi;q=0.8",
    "content-type": "multipart/form-data; boundary=----WebKitFormBoundarynjfgIwEBA4D84nd0",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Not;A=Brand\";v=\"99\", \"Microsoft Edge\";v=\"139\", \"Chromium\";v=\"139\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-requested-with": "XMLHttpRequest"
  },
  "body": "------WebKitFormBoundarynjfgIwEBA4D84nd0\r\nContent-Disposition: form-data; name=\"phong\"\r\n\r\n25967d141745c238e063620a0a0ac01a\r\n------WebKitFormBoundarynjfgIwEBA4D84nd0\r\nContent-Disposition: form-data; name=\"loaibn\"\r\n\r\n\r\n------WebKitFormBoundarynjfgIwEBA4D84nd0\r\nContent-Disposition: form-data; name=\"mabn\"\r\n\r\n\r\n------WebKitFormBoundarynjfgIwEBA4D84nd0\r\nContent-Disposition: form-data; name=\"tk\"\r\n\r\n0\r\n------WebKitFormBoundarynjfgIwEBA4D84nd0\r\nContent-Disposition: form-data; name=\"cbAll\"\r\n\r\n1\r\n------WebKitFormBoundarynjfgIwEBA4D84nd0--\r\n",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});```
 và respond cũng không khác mấy ```{"isValid":true,"message":"","data":[{"makp":"551","tenkp":"KHOA NGO\u1EA0I L\u1ED2NG NG\u1EF0C - M\u1EA0CH M\u00C1U","mabn":"2510223501","hoten":"NGUY\u1EC4N TH\u1ECA X\u00C2Y","ngaysinh":"1966-02-01T00:00:00","namsinh":"1966","phai":1,"gioitinh":"N\u1EEF","mavaovien":"250829071018689457","maql":"250829071018689457","idKhoa":"250830165953899733","ngayvv":"29/08/2025 07:03","ngayrv":null,"ngaydukienrv":"","madoituong":1,"doituong":"BHYT","makpvv":"551","tenkpvv":"KHOA NGO\u1EA0I L\u1ED2NG NG\u1EF0C - M\u1EA0CH M\u00C1U","maicdvv":"D38.1","chandoanvv":"U th\u00F9y tr\u00EAn ph\u1ED5i ph\u1EA3i","ngayvk":"30/08/2025 16:30","tuoivao":"0590","maicdvk":"D38.1","chandoanvk":"U th\u00F9y tr\u00EAn ph\u1ED5i ph\u1EA3i","chandoanvk1":null,"mat":"","maba":11,"tenba":"B\u1EC7nh \u00E1n ngo\u1EA1i khoa","mabs":"9725","dienthoai":"083****777","cccd":"080166012723","ngaydt":"1","tenbs":"ThS.BSNT.CKI Ph\u1EA1m H\u01B0ng","sdt":null,"sothe":"GD480802310398879059","tungay":"02/03/2025 00:00:00","denngay":"02/02/2026 00:00:00","toanha":"e510f133e2356fb0e053020a14ac71e4","mA_TOANHA":"C","teN_TOANHA":"T\u00F2a C","tang":"e54a6ddf41885d6ae053020a14ac2eb0","mA_TANG":"T2","teN_TANG":"T\u1EA7ng 2","phong":"25967d141745c238e063620a0a0ac01a","mA_PHONG":"P215","teN_PHONG":"Ph\u00F2ng 215","giuong":"25967d141748c238e063620a0a0ac01a","mA_GIUONG":"G215-A","teN_GIUONG":"G215-A","tentt":"T\u1EC9nh Long An","tenquan":"Huy\u1EC7n \u0110\u1EE9c Ho\u00E0","tenpxa":"X\u00E3 Ho\u00E0 Kh\u00E1nh \u0110\u00F4ng","sonha":"\u1EA4p Th\u00F4i M\u00F4i ","cholam":"","diachi":"\u1EA4p Th\u00F4i M\u00F4i,X\u00E3 Ho\u00E0 Kh\u00E1nh \u0110\u00F4ng - Huy\u1EC7n \u0110\u1EE9c Ho\u00E0 - T\u1EC9nh Long An","lan":0,"idseqkhamlai":0,"checkuP_ID":null,"khamlai":0,"phuongphappt":null,"mapppt":null,"ngaykham":null,"tenkhoachuyen":"KHOA G\u00C2Y M\u00CA - H\u1ED2I S\u1EE8C","khoachuyen":"048","sovaovien":"0025496/25","ngaypt":null,"ngayvksort":"2025-08-30T16:30:00","loaibn":1,"todieutri":1,"istienme":0,"history":null,"coloR_STATUS":null,"noicapcccd":"","ngaycapcccd":null,"nam":"0825\u002B"},{"makp":"551","tenkp":"KHOA NGO\u1EA0I L\u1ED2NG NG\u1EF0C - M\u1EA0CH M\u00C1U","mabn":"2510242046","hoten":"NGUY\u1EC4N TH\u1ECA M\u1EF8 H\u1EA0NH","ngaysinh":"1984-08-03T00:00:00","namsinh":"1984","phai":1,"gioitinh":"N\u1EEF","mavaovien":"250828105820496029","maql":"250828140625907339","idKhoa":"250829154946857767","ngayvv":"28/08/2025 14:06","ngayrv":null,"ngaydukienrv":"","madoituong":1,"doituong":"BHYT","makpvv":"551","tenkpvv":"KHOA NGO\u1EA0I L\u1ED2NG NG\u1EF0C - M\u1EA0CH M\u00C1U","maicdvv":"E04.2","chandoanvv":"B\u01B0\u1EDBu gi\u00E1p \u0111a nh\u00E2n hai th\u00F9y th\u00F2ng trung th\u1EA5t","ngayvk":"29/08/2025 15:47","tuoivao":"0410","maicdvk":"E04.2","chandoanvk":"B\u01B0\u1EDBu gi\u00E1p \u0111a nh\u00E2n hai th\u00F9y th\u00F2ng trung th\u1EA5t","chandoanvk1":null,"mat":"","maba":11,"tenba":"B\u1EC7nh \u00E1n ngo\u1EA1i khoa","mabs":"2638","dienthoai":"094****634","cccd":"068184002016","ngaydt":"2","tenbs":"BS.CKI Tr\u1EA7n Qu\u1ED1c Ho\u00E0i","sdt":null,"sothe":"DN479791222815979058","tungay":"01/01/2025 00:00:00","denngay":"12/31/2025 00:00:00","toanha":"e510f133e2356fb0e053020a14ac71e4","mA_TOANHA":"C","teN_TOANHA":"T\u00F2a C","tang":"e54a6ddf41885d6ae053020a14ac2eb0","mA_TANG":"T2","teN_TANG":"T\u1EA7ng 2","phong":"25967d141745c238e063620a0a0ac01a","mA_PHONG":"P215","teN_PHONG":"Ph\u00F2ng 215","giuong":"25967d141749c238e063620a0a0ac01a","mA_GIUONG":"G215-B","teN_GIUONG":"G215-B","tentt":"Th\u00E0nh ph\u1ED1 H\u1ED3 Ch\u00ED Minh","tenquan":"Qu\u1EADn B\u00ECnh T\u00E2n","tenpxa":"Ph\u01B0\u1EDDng T\u00E2n T\u1EA1o","sonha":"4.03 L\u00F4 B1 c/c T\u00E2n Mai","cholam":"","diachi":"4.03 L\u00F4 B1 c/c T\u00E2n Mai,Ph\u01B0\u1EDDng T\u00E2n T\u1EA1o - Qu\u1EADn B\u00ECnh T\u00E2n - Th\u00E0nh ph\u1ED1 H\u1ED3 Ch\u00ED Minh","lan":0,"idseqkhamlai":0,"checkuP_ID":null,"khamlai":0,"phuongphappt":null,"mapppt":null,"ngaykham":null,"tenkhoachuyen":"KHOA G\u00C2Y M\u00CA - H\u1ED2I S\u1EE8C","khoachuyen":"048","sovaovien":"0025434/25","ngaypt":null,"ngayvksort":"2025-08-29T15:47:00","loaibn":1,"todieutri":1,"istienme":0,"history":null,"coloR_STATUS":null,"noicapcccd":"","ngaycapcccd":null,"nam":"0825\u002B"}],"dataThongKe":[{"ma":"TK006","name":"\u0110\u00E3 kh\u00E1m","displayname":"\u0110\u00E3 kh\u00E1m","count":2,"date":"31/08/2025"},{"ma":"TK007","name":"Ch\u01B0a kh\u00E1m","displayname":"Ch\u01B0a kh\u00E1m","count":0,"date":"31/08/2025"},{"ma":"TK008","name":"\u0110\u00E3 kh\u00E1m","displayname":"\u0110\u00E3 kh\u00E1m","count":0,"date":"31/08/2025"},{"ma":"TK009","name":"Ch\u01B0a kh\u00E1m","displayname":"Ch\u01B0a kh\u00E1m","count":0,"date":"31/08/2025"},{"ma":"TK005","name":"Hi\u1EC7n Di\u1EC7n","displayname":"Hi\u1EC7n Di\u1EC7n","count":2,"date":"31/08/2025"},{"ma":"TK006","name":"\u0110\u00E3 kh\u00E1m","displayname":"\u0110\u00E3 kh\u00E1m","count":2,"date":"31/08/2025"},{"ma":"TK007","name":"Ch\u01B0a kh\u00E1m","displayname":"Ch\u01B0a kh\u00E1m","count":0,"date":"31/08/2025"}]}``` có thể tận dụng lại API khoa đã có sẵn.