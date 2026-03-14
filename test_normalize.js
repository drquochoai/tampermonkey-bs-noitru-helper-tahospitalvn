
const doctorsInConfig = [
    'PGS.TS.BS Vũ Hữu Vĩnh',
    'TS.BS Nguyễn Anh Dũng',
    'ThS.BS Lê Thị Ngọc Hằng',
    'BS.CKI Trần Quốc Hoài',
    'ThS.BS Lê Chí Hiếu',
    'ThS.BS Phan Vũ Hồng Hải',
    'ThS.BSNT.CKI Phạm Hưng',
    'ThS.BS Nguyễn Đức Nghĩa'
];

function normalizeNameOld(name) {
    if (!name) return '';
    return name.toLowerCase()
        .replace(/^(pgs\.ts\.bs|ts\.bs|ths\.bsnt\.cki|ths\.bs|bs\.cki|bs|bác sĩ)\s+/i, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeNameNew(name) {
    if (!name) return '';
    // Optimized normalization:
    // 1. Lowercase
    // 2. Clear all characters that are not letters or spaces (removes ., /, numbers)
    // 3. Remove common title words
    // 4. Trim and compact spaces
    const titles = ['pgs', 'ts', 'bs', 'ths', 'bsnt', 'cki', 'ckii', 'bac', 'si', 'ck1', 'ck2'];
    let n = name.toLowerCase()
        .replace(/[^a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ]/gi, ' ')
        .split(/\s+/)
        .filter(word => word.length > 0 && !titles.includes(word))
        .join(' ');
    return n;
}

const testCases = [
    { name: "PGS.TS.BS Vũ Hữu Vĩnh", data: "Vũ Hữu Vĩnh" },
    { name: "TS.BS Nguyễn Anh Dũng", data: "TS. Nguyễn Anh Dũng" },
    { name: "ThS.BS Lê Thị Ngọc Hằng", data: "Lê Thị Ngọc Hằng" },
    { name: "BS.CKI Trần Quốc Hoài", data: "BSCKI Trần Quốc Hoài" },
    { name: "ThS.BSNT.CKI Phạm Hưng", data: "ThS.BS Phạm Hưng" },
    { name: "ThS.BS Nguyễn Đức Nghĩa", data: "BS Nguyễn Đức Nghĩa" },
    { name: "BS.CKI Trần Quốc Hoài", data: "Trần Quốc Hoài (PTV)"}
];

console.log("--- TEST NORMALIZATION ---");
doctorsInConfig.forEach(doc => {
    console.log(`Original: [${doc}]`);
    console.log(`  Old: [${normalizeNameOld(doc)}]`);
    console.log(`  New: [${normalizeNameNew(doc)}]`);
});

console.log("\n--- TEST MATCHING ---");
testCases.forEach(tc => {
    const normConfigOld = normalizeNameOld(tc.name);
    const normDataOld = normalizeNameOld(tc.data);
    const matchOld = normConfigOld.includes(normDataOld) || normDataOld.includes(normConfigOld);

    const normConfigNew = normalizeNameNew(tc.name);
    const normDataNew = normalizeNameNew(tc.data);
    const matchNew = normConfigNew.includes(normDataNew) || normDataNew.includes(normConfigNew);

    console.log(`Filter: [${tc.name}] | Data: [${tc.data}]`);
    console.log(`  Match Old: ${matchOld ? '✅' : '❌'} (${normConfigOld} vs ${normDataOld})`);
    console.log(`  Match New: ${matchNew ? '✅' : '❌'} (${normConfigNew} vs ${normDataNew})`);
});
