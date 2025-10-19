# OTM Token Service - Hướng dẫn sử dụng

## Giới thiệu

OTM Token Service là một module mới được tạo ra để thay thế việc mở tab OTM mỗi lần cần lấy dữ liệu. Module này có thể:

1. **Lưu trữ token OTM** vào API service của chúng ta (giống như checklistService)
2. **Tự động lấy token mới** khi cần thiết bằng cách mở tab OTM
3. **Thực hiện các API call trực tiếp** tới OTM mà không cần mở tab
4. **Validate token** và tự động refresh khi hết hạn

## Cấu trúc module

### Các file chính

- `src/services/otm.token.js` - Service chính
- `src/pages/page.lichmo.homnay.refactored.js` - Trang lịch mổ sử dụng service mới
- `src/pages/page.settings.otm.quanlyphauthuat.refactored.js` - Trang quản lý phẫu thuật sử dụng service mới
- `src/utils/demo.otm.token.js` - Module demo để test
- `src/pages/otm.content.script.js` - Đã được cập nhật để support token extraction

## Cách hoạt động

### 1. Lưu trữ token

Token được lưu vào API service của chúng ta với MABN đặc biệt: `%9191_otm_token` và sử dụng fixed dates: `tungay` và `denngay` là `1010-10-10 10:10`

```javascript
// Token được lưu như một checklist record với cấu trúc:
{
    mabn: '%9191_otm_token',
    hoten: 'OTM_TOKEN_STORAGE',
    tungay: '1010-10-10 10:10',
    denngay: '1010-10-10 10:10',
    chuky: JSON.stringify({
        token: 'eyJhbGc...',
        expiry: 1757342742000,
        savedAt: 1757256342000
    })
}
```

### 2. Tự động lấy token

Khi không có token hoặc token hết hạn, service sẽ:
1. Mở tab OTM với parameter `?otm-token=...`
2. Content script sẽ thực hiện automation để lấy token
3. Token được gửi về parent window
4. Service lưu token vào API storage

### 3. Direct API calls

Tất cả API calls tới OTM được thực hiện qua `GM_xmlhttpRequest` để tránh CORS issues.

## API Reference

### OTMTokenService.getValidToken()

Lấy token hợp lệ (từ cache, storage, hoặc tự động lấy mới)

```javascript
const token = await OTMTokenService.getValidToken();
console.log('Token:', token);
```

### OTMTokenService.makeOTMRequest(url, options)

Thực hiện API call tới OTM với token tự động

```javascript
const data = await OTMTokenService.makeOTMRequest(
    'https://otm.tahospital.vn/api/booking?date=2025-09-08T17:00:00.000Z',
    {
        method: 'GET',
        headers: { 'siteid': '1' }
    }
);
```

### OTMTokenService.fetchSurgeries(fromDate, toDate)

Lấy dữ liệu phẫu thuật theo khoảng thời gian

```javascript
// Lấy phẫu thuật hôm nay
const today = new Date().toISOString().split('T')[0];
const surgeries = await OTMTokenService.fetchSurgeries(today, today);

// Lấy phẫu thuật trong tuần
const fromDate = '2025-09-08';
const toDate = '2025-09-14';
const surgeries = await OTMTokenService.fetchSurgeries(fromDate, toDate);
```

### OTMTokenService.fetchUsers()

Lấy danh sách người dùng OTM

```javascript
const users = await OTMTokenService.fetchUsers();
console.log('Users:', users.length);
```

### OTMTokenService.fetchRoomsWithDepartment()

Lấy danh sách phòng mổ với thông tin khoa

```javascript
const rooms = await OTMTokenService.fetchRoomsWithDepartment();
console.log('Rooms:', rooms);
```

## Cách sử dụng trong project

### 1. Thay thế page cũ

Thay vì sử dụng:
- `src/pages/page.lichmo.homnay.js`
- `src/pages/page.settings.otm.quanlyphauthuat.js`

Hãy sử dụng:
- `src/pages/page.lichmo.homnay.refactored.js` 
- `src/pages/page.settings.otm.quanlyphauthuat.refactored.js`

### 2. Import và sử dụng

```javascript
const OTMTokenService = require('../services/otm.token');

// Trong function của bạn
async function loadSurgeryData() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const surgeries = await OTMTokenService.fetchSurgeries(today, today);
        
        // Xử lý dữ liệu
        console.log('Loaded', surgeries.length, 'surgeries');
        
    } catch (error) {
        if (error.message === 'TOKEN_EXPIRED') {
            // Token hết hạn, service sẽ tự động lấy token mới
            console.log('Token expired, will get new one automatically');
        } else if (error.message === 'NO_TOKEN') {
            // Không có token, cần đăng nhập OTM
            console.log('Please login to OTM first');
        }
    }
}
```

### 3. Error handling

Service có các loại error chính:

- `TOKEN_EXPIRED` - Token hết hạn (service sẽ tự động retry với token mới)
- `NO_TOKEN` - Không có token (cần đăng nhập OTM)
- `REQUEST_TIMEOUT` - Timeout khi gọi API
- `HTTP_xxx` - Lỗi HTTP từ server OTM

## Testing và Debug

### 1. Sử dụng Demo module

```javascript
// Trong console của browser
const demo = require('./src/utils/demo.otm.token.js');

// Chạy test nhanh
await demo.quickTest();

// Chạy test storage với fixed dates
await demo.testTokenStorage();

// Chạy tất cả test
await demo.runAllTests();

// Test từng phần
await demo.testGetToken();
await demo.testFetchSurgeries();
await demo.testFetchUsers();
```

### 2. Debug logs

Bật debug bằng cách set localStorage:

```javascript
localStorage.setItem('dr_debug_otm', 'true');
```

### 3. Clear cache

Để clear cache token và test lại:

```javascript
// Clear token cache
OTMTokenService._tokenCache = { token: null, expiry: 0, lastValidated: 0 };

// Hoặc clear storage (cần tái tạo token)
// localStorage.removeItem('otm_bearer_token');
```

## Migration từ code cũ

### 1. Thay thế openOTMSurgeriesTab

**Cũ:**
```javascript
openOTMSurgeriesTab(fromDate, toDate);

// Sau đó listen message
subscribeOTMMessages(
    (data) => { /* handle success */ },
    (progress) => { /* handle progress */ },
    (error) => { /* handle error */ }
);
```

**Mới:**
```javascript
try {
    const surgeries = await OTMTokenService.fetchSurgeries(fromDate, toDate);
    // Handle success directly
} catch (error) {
    // Handle error directly
}
```

### 2. Thay thế ensureOTMUsers

**Cũ:**
```javascript
async function ensureOTMUsers() {
    const token = getBearerToken();
    if (!token) throw new Error('NO_TOKEN');
    
    const res = await fetch(url, {
        headers: { 'authorization': `Bearer ${token}` }
    });
    // ...
}
```

**Mới:**
```javascript
async function ensureOTMUsers() {
    return await OTMTokenService.fetchUsers();
}
```

## Performance Benefits

1. **Không cần mở tab** - API calls trực tiếp nhanh hơn
2. **Token caching** - Giảm số lần phải lấy token mới
3. **Automatic retry** - Tự động retry với token mới khi hết hạn
4. **Persistent storage** - Token được lưu lâu dài, không mất khi refresh trang

## Lưu ý quan trọng

1. **GM_xmlhttpRequest required** - Cần Tampermonkey/Greasemonkey để bypass CORS
2. **Token expiry** - Token có thể hết hạn, service sẽ tự động handle
3. **Error handling** - Luôn wrap trong try-catch block
4. **Rate limiting** - Tránh gọi quá nhiều API calls cùng lúc

## Roadmap

- [ ] Add more OTM API endpoints
- [ ] Improve error handling and retry logic
- [ ] Add token refresh scheduling
- [ ] Support multiple token sources
- [ ] Add request queueing and throttling
