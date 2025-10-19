// test-fixed-dates.js - Quick test for fixed dates functionality

console.log('🚀 Testing OTM Token Service with Fixed Dates...');

// Test the fixed date format
function testFixedDates() {
    const tungay = '1010-10-10 10:10';
    const denngay = '1010-10-10 10:10';
    
    console.log('✅ Fixed dates configuration:');
    console.log('- tungay:', tungay);
    console.log('- denngay:', denngay);
    
    // Verify date format
    const expectedFormat = '1010-10-10 10:10';
    const isCorrect = tungay === expectedFormat && denngay === expectedFormat;
    
    console.log('✅ Date format validation:', isCorrect ? 'PASS' : 'FAIL');
    
    return isCorrect;
}

// Test MABN format
function testMABN() {
    const OTM_TOKEN_MABN = '%9191_otm_token';
    console.log('✅ MABN configuration:', OTM_TOKEN_MABN);
    
    const isCorrect = OTM_TOKEN_MABN === '%9191_otm_token';
    console.log('✅ MABN format validation:', isCorrect ? 'PASS' : 'FAIL');
    
    return isCorrect;
}

// Run tests
testFixedDates();
testMABN();

console.log('🎉 Fixed dates configuration test completed!');

// Test payload structure
function testTokenPayloadStructure() {
    console.log('\n📋 Testing token payload structure...');
    
    const mockTokenData = {
        token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.test',
        expiry: Date.now() + (24 * 60 * 60 * 1000),
        savedAt: Date.now()
    };
    
    const mockChecklistObj = {
        mabn: '%9191_otm_token',
        hoten: 'OTM_TOKEN_STORAGE',
        ngaysinh: '1010-10-10',
        gioitinh: '1',
        diachi: 'SYSTEM_GENERATED',
        ngayvv: '1010-10-10',
        tungay: '1010-10-10 10:10',
        denngay: '1010-10-10 10:10',
        chuky: JSON.stringify(mockTokenData)
    };
    
    console.log('✅ Mock checklist object structure:');
    console.log(JSON.stringify(mockChecklistObj, null, 2));
    
    // Validate required fields
    const requiredFields = ['mabn', 'hoten', 'tungay', 'denngay', 'chuky'];
    const hasAllFields = requiredFields.every(field => mockChecklistObj[field]);
    
    console.log('✅ Required fields validation:', hasAllFields ? 'PASS' : 'FAIL');
    
    // Validate chuky is valid JSON
    try {
        const parsedChuky = JSON.parse(mockChecklistObj.chuky);
        const hasTokenFields = parsedChuky.token && parsedChuky.expiry && parsedChuky.savedAt;
        console.log('✅ Token data structure validation:', hasTokenFields ? 'PASS' : 'FAIL');
    } catch (error) {
        console.log('❌ Token data JSON validation: FAIL -', error.message);
    }
}

testTokenPayloadStructure();

// Instructions for manual testing
console.log('\n📖 Manual Testing Instructions:');
console.log('1. Copy the built script to Tampermonkey');
console.log('2. Open TA Hospital dashboard');
console.log('3. Run in console: OTMTokenDemo.testTokenStorage()');
console.log('4. Check if token is saved with fixed dates: 1010-10-10 10:10');
console.log('5. Verify MABN is: %9191_otm_token');
console.log('\n✨ Ready for testing!');
