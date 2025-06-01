// ==UserScript==
// @name         BS Nội trú - Helper (TA Hospital)
// @namespace    http://tampermonkey.net/
// @version      1.2.7
// @description  Hỗ trợ dữ liệu bệnh nhân từ bs-noitru.tahospital.vn.
// @author       BS.CKI Trần Quốc Hoài, tahospital.vn
// @match        https://bs-noitru.tahospital.vn/*
// @match        https://dd-noitru.tahospital.vn/*
// @match        https://hsba.tahospital.vn/*
// @grant        GM_xmlhttpRequest
// @license      MIT
// @connect      google.com
// @connect      tahospital.vn
// @connect      script.google.com
// @connect      googleusercontent.com
// @connect      *
// @sandbox      MAIN_WORLD
// @require      https://github.com/drquochoai/tampermonkey-bs-noitru-helper-tahospitalvn/raw/main/common/utils.js
// @require      https://github.com/drquochoai/tampermonkey-bs-noitru-helper-tahospitalvn/raw/main/common/styles.js
// @require      https://github.com/drquochoai/tampermonkey-bs-noitru-helper-tahospitalvn/raw/main/noitru.tahospital.vn/dashboard.js
// @require      https://github.com/drquochoai/tampermonkey-bs-noitru-helper-tahospitalvn/raw/main/noitru.tahospital.vn/todieutri-helper.js
// @require      https://github.com/drquochoai/tampermonkey-bs-noitru-helper-tahospitalvn/raw/main/hsba.tahospital.vn/hsba-enhance.js
// ==/UserScript==

// Mọi logic đã được tách ra các module. File này chỉ dùng để khai báo meta và @require các module.