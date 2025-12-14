// BS_CAI_DAT_GIAO_DIEN.js
// File cấu hình giao diện cho hệ thống Bệnh Sử Nội Trú
// Có thể chỉnh sửa các cài đặt này để tùy chỉnh giao diện

const BS_CAI_DAT = {
    // ================== CÀI ĐẶT HSBA ==================
    // Quy tắc xử lý tài liệu HSBA.
    // - tenmau: Tên mẫu tài liệu gốc từ HSBA V2
    // - show: true nếu muốn hiển thị trong danh sách "dr-hsba-item"
    // - sync: true nếu muốn dùng tài liệu này để đồng bộ với checklist bộ mổ
    // - checklist: (tùy chọn) Nhãn checklist mục tiêu khi sync === true
    // Lưu ý: Một mục có thể chỉ show (hiển thị) hoặc chỉ sync (đồng bộ) hoặc cả hai.
    HSBA_CHECKLIST_MAP: [
        // Hiển thị + Đồng bộ vào checklist
        { tenmau: 'Phiếu khám bệnh vào viện', show: true, sync: true, checklist: 'Phiếu Khám vào viện (hsoft)' },
        { tenmau: 'Biên bản hội chẩn duyệt mổ', show: true, sync: true, checklist: 'Tạo Biên bản Hội chẩn duyệt mổ (web)' },
        { tenmau: 'Phiếu cung cấp thông tin chẩn đoán, điều trị và chi phí', show: true, sync: true, checklist: 'Phiếu cung cấp thông tin, chẩn đoán và điều trị (hsoft)' },
        { tenmau: 'Giấy cam đoan thực hiện Phẫu thuật, Thủ thuật và Gây mê hồi sức', show: true, sync: true, checklist: '57. Cam kết phẫu thuật thủ thuật (hsoft)' },
        { tenmau: 'Phiếu khai thác tiền sử dị ứng', show: true, sync: true, checklist: 'Phiếu khai thác tiền sử dị ứng (hsoft)' },
        { tenmau: 'Phiếu HKTT trên bệnh người Phẫu thuật', show: false, sync: true, checklist: 'Đánh giá nguy cơ huyết khối (web)' },
        { tenmau: 'Phiếu khám tiền mê', show: true, sync: true, checklist: 'ĐÃ khám tiền mê CHƯA?' },

        // Chỉ hiển thị (không sync checklist)
        { tenmau: 'Phiếu khám chuyên khoa', show: true, sync: false },
        { tenmau: 'Phiếu tường trình phẫu thuật, thủ thuật', show: true, sync: false },
        { tenmau: 'Phiếu khám bệnh', show: true, sync: false },
        { tenmau: 'Toa thuốc ngoại trú', show: true, sync: false },

        // Không hiển thị (chỉ sync checklist)
        { tenmau: 'Phiếu Theo dõi điều trị', show: true, sync: true, checklist: 'Tờ điều trị (web)' },

        // Có thể bổ sung thêm nếu cần
    ],
    // ================== CÀI ĐẶT CHECKLIST ==================
    checklistItems: [
        'Phiếu Khám vào viện (hsoft)',
        'Bệnh án Ngoại khoa',
        'Tờ điều trị (web)',
        'Tạo Biên bản Hội chẩn duyệt mổ (web)',
        'Phiếu khai thác tiền sử dị ứng (hsoft)',
        '57. Cam kết phẫu thuật thủ thuật (hsoft)',
        'Phiếu cung cấp thông tin, chẩn đoán và điều trị (hsoft)',
        'Đánh giá nguy cơ huyết khối (web)',
        'Chuyển xét nghiệm vào khoa (hsoft) và ✅ ký số',
        'Đánh dấu vết mổ',
        'ĐÃ khám tiền mê CHƯA?',
        'ĐÃ đặt lịch mổ CHƯA?',
        'ĐÃ ghi y lệnh chuyển mổ',
        'Phiếu kiểm tra HIV test (hsoft)',
    ],

    // ================== CÀI ĐẶT CHECKLIST XUẤT VIỆN ==================
    checklistXuatVien: [
        'Mở HSBA v2',
        'Tạo tờ điều trị cuối (chỉnh chẩn đoán, ICD)',
        'Mở trang dặn dò',
        'Giấy ra viện',
        'Tóm tắt bệnh án',
        // Tờ điều trị sẽ có checklist con
        {
            label: 'Tờ điều trị',
            children: [
                'Thực hiện y lệnh thuốc đã dự trù',
                'Cấp các cử thuốc còn lại của người bệnh khi xuất viện',
                'Ký toa thuốc ra viện, In toa',
                'Chuyển dược',
                'Ký số các CLS tồn',
                'Tổng kết bệnh án trong tờ điều trị',
                'Tổng kết bệnh án điện tử',
            ]
        }
    ],

    // ================== CÀI ĐẶT Y LỆNH QUICK ACTIONS ==================
    quickYLenhActions: [
        { label: 'Xuất viện', icon: '🏠', color: '#4caf50' },
        { label: 'Cận lâm sàng', icon: '🧪', color: '#06b6d4' },
        { label: 'Đã đánh thuốc', icon: '💊', color: '#16a34a' },
        { label: 'Thay băng', icon: '👗', color: '#310994ff' },
        { label: 'Rút ODL vết mổ', icon: '🩹', color: '#ff9800' },
        { label: 'Rút ODL phổi', icon: '🫁', color: '#2196f3' },
        { label: 'Rút sonde tiểu', icon: '🔗', color: '#9c27b0' }
    ],

    // ================== CÀI ĐẶT BÁC SĨ ==================
    danhSachBacSi: [
        'PGS.TS.BS Vũ Hữu Vĩnh',
        'TS.BS Nguyễn Anh Dũng',
        'BS.CKII Trần Công Quyền',
        'ThS.BS Lê Thị Ngọc Hằng',
        'BS.CKI Trần Quốc Hoài',
        'ThS.BS Lê Chí Hiếu',
        'ThS.BS Phan Vũ Hồng Hải',
        'ThS.BSNT.CKI Phạm Hưng',
        'ThS.BS Nguyễn Đức Nghĩa'
    ],

    // ================== CÀI ĐẶT THẺ TRẮNG (WHITE-CARD ROOMS) ==================
    // Danh sách phòng sẽ hiển thị thẻ màu trắng (sử dụng bởi isWhiteCard(room))
    whiteCardRooms: [
        'Phòng 302',
        'Phòng 303',
        'Phòng 304',
        'Phòng 306D',
        'Phòng 307',
        'Phòng 305D',
        'Phòng 300',
        'Phòng 301'
    ],

    // ================== CÀI ĐẶT PHẪU THUẬT ==================
    phauThuatDefaults: {
        defaultDate: 'tomorrow', // 'tomorrow' | 'today' | null
        defaultTime: '07:30',
    },

    // ================== CÀI ĐẶT MÀU SẮC VÀ GIAO DIỆN ==================
    colors: {
        // Màu chính
        primary: '#1976d2',
        secondary: '#4caf50',
        danger: '#d32f2f',
        warning: '#ff9800',
        info: '#2196f3',

        // Màu cho thẻ bệnh nhân
        cardBackground: '#fff',
        cardBorder: '#e0e0e0',
        blueCardBackground: '#e3f2fd',

        // Màu cho tags y lệnh
        tagDefault: '#4caf50',
        tagBackground: 'rgba(76, 175, 80, 0.1)',
        tagBorder: 'rgba(76, 175, 80, 0.3)',
    },

    // ================== CÀI ĐẶT TAGS ==================
    tags: {
        maxDisplayTags: 3, // Số lượng tags tối đa hiển thị trên mỗi thẻ bệnh nhân
        showOnlyToday: true, // Chỉ hiển thị y lệnh hôm nay
        defaultIcon: '📋',

        // Cài đặt cho celebration (khi có tag Xuất viện)
        celebration: {
            enabled: true, // Bật/tắt hiệu ứng celebration
            glowColor: '#4caf50', // Màu glow animation
            borderWidth: '3px', // Độ dày viền celebration
            animationDuration: '2s', // Thời gian animation
        }
    },

    // ================== CÀI ĐẶT THỜI GIAN ==================
    timing: {
        autoSaveDelay: 500, // ms - thời gian delay khi auto-save
        loadChecklistDelay: 100, // ms - thời gian delay khi load checklist
        eventListenerDelay: 10, // ms - thời gian delay khi setup event listeners
    },

    // ================== CÀI ĐẶT DEBUG ==================
    debug: {
        enableLogging: false, // Bật/tắt console.log
        enableTagsTest: true, // Bật/tắt function test tags
        defaultTestMabn: '2510149440', // Mã bệnh nhân mặc định để test
    },

    // ================== CÀI ĐẶT TEXT ==================
    text: {
        noYLenhMessage: 'Chưa có y lệnh nào...',
        noPhauThuatMessage: 'Chưa có phẫu thuật nào...',
        loadingMessage: 'Đang tải checklist...',
        noDataMessage: 'Không có dữ liệu',
        errorMessage: 'Lỗi tải checklist',

        // Tiêu đề các phần
        checklistTitle: 'Checklist bộ mổ',
        phauThuatTitle: 'Thông tin phẫu thuật',
        yLenhTitle: 'Log y lệnh',

        // Button text
        addPhauThuatBtn: 'Thêm phẫu thuật',
        addYLenhBtn: 'Thêm',
        saveBtn: 'Lưu',
        cancelBtn: 'Hủy',
        deleteBtn: 'Xóa',

        // Placeholder text
        yLenhPlaceholder: 'Nhập y lệnh (VD: rút sonde tiểu)',
        ppptPlaceholder: 'Nhập PPPT',
        datePlaceholder: 'dd/mm/yyyy',
    },

    // ================== CÀI ĐẶT VALIDATION ==================
    validation: {
        requiredFields: {
            phauThuat: ['date', 'time', 'method', 'doctors'],
            yLenh: ['content']
        },
        dateFormat: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
        messages: {
            missingPhauThuatInfo: 'Vui lòng nhập đầy đủ thông tin phẫu thuật!',
            invalidDateFormat: 'Vui lòng nhập ngày theo định dạng dd/mm/yyyy!',
            invalidMonth: 'Tháng không hợp lệ (1-12)!',
            invalidDay: 'Ngày không hợp lệ (1-31)!',
            invalidDate: 'Ngày không tồn tại!',
            noDoctorSelected: 'Vui lòng chọn ít nhất một bác sĩ!',
        }
    },

    // ================== CÀI ĐẶT LAYOUT ==================
    layout: {
        sidebar: {
            width: '80vw',
            maxWidth: '80vw',
            zIndex: 100000,
        },

        popup: {
            maxWidth: '500px',
            width: '90vw',
            maxHeight: '80vh',
            zIndex: 100001,
        },

        cards: {
            gap: '16px',
            borderRadius: '8px',
            padding: '16px',
        }
    }
};

// Export cho Node.js environment (browserify)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BS_CAI_DAT;
}

// Export cho browser environment
if (typeof window !== 'undefined') {
    window.BS_CAI_DAT = BS_CAI_DAT;
}
