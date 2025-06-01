// noitru.tahospital.vn/todieutri-helper.js
// Xử lý riêng cho trang /to-dieu-tri nếu cần
(function() {
    if (!/^(bs|dd)-noitru\.tahospital\.vn$/.test(window.location.hostname)) return;
    if (!/\/to-dieu-tri(\?.*)?$/.test(window.location.pathname)) return;
    // Thêm code xử lý riêng cho /to-dieu-tri tại đây
    alert('Đã nạp helper cho trang /to-dieu-tri');
    // Nếu URL kết thúc bằng /to-dieu-tri thì tự động click #cbTaCa nếu tồn tại
    function autoClickCbTaCaIfNeeded() {
        if (/\/to-dieu-tri(\?.*)?$/.test(window.location.pathname) || window.location.href.includes('DanhSachBenhNhan')) {
            if (window.$ && $('#ddlKhoa').on) {
                $('#ddlKhoa').on('change', function () {
                    localStorage.setItem('bsnt_selected_khoa', $(this).val());
                });
            }
            setTimeout(() => {
                const savedKhoa = localStorage.getItem('bsnt_selected_khoa') || "551";
                if (window.$ && $('#ddlKhoa').val) {
                    $('#ddlKhoa').val(savedKhoa).change();
                }
                console.log('Đã tự động chọn khoa ' + savedKhoa + ' trong dropdown #ddlKhoa');
            }, 500);
            const cb = document.getElementById('cbTaCa');
            if (cb) {
                cb.click();
            }
        }
    }
    autoClickCbTaCaIfNeeded();
})();
