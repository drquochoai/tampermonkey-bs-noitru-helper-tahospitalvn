const fs = require('fs');
const path = require('path');

const header = `// ==UserScript==
// @name         BS Nội trú - Helper (TA Hospital) - By drquochoai, BS.CKI Trần Quốc Hoài
// @namespace    http://tampermonkey.net/
// @version      1.6.0
// @description  Hỗ trợ dữ liệu bệnh nhân từ bs-noitru.tahospital.vn.
// @author       BS.CKI Trần Quốc Hoài, tahospital.vn
// @match        https://bs-noitru.tahospital.vn/*
// @match        https://dd-noitru.tahospital.vn/*
// @match        https://hsba.tahospital.vn/*
// @grant        GM_xmlhttpRequest
// @license      MIT
// @connect      google.com
// @connect      tahospital.vn
// @connect      bs-noitru.tahospital.vn
// @connect      script.google.com
// @connect      googleusercontent.com
// @connect      *
// @sandbox      MAIN_WORLD
// ==/UserScript==
`;

const filePath = path.join(__dirname, 'dist', 'bs-noitru-fetch.user.js');

// Read the bundled file
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading bundled file:', err);
    process.exit(1);
  }

  // Prepend the header to the file content
  const modifiedContent = header + '\n' + data;

  // Write the modified content back to the file
  fs.writeFile(filePath, modifiedContent, 'utf8', (err) => {
    if (err) {
      console.error('Error writing modified file:', err);
      process.exit(1);
    }
    console.log('Successfully added UserScript header to the bundled file.');
  });
});
