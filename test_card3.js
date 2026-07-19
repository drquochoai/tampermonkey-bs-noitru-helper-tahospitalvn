const fs = require('fs');
console.log(fs.readFileSync('src/pages/page.dashboard.js', 'utf8').includes('updatePatientCardTags'));
