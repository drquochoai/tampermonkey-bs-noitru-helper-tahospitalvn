// noitru.tahospital.vn/todieutri-helper.js
// Xử lý riêng cho trang /to-dieu-tri nếu cần
(function() {
    if (!/^(bs|dd)-noitru\.tahospital\.vn$/.test(window.location.hostname)) return;
    if (!/\/to-dieu-tri(\?.*)?$/.test(window.location.pathname)) return;
    // Thêm code xử lý riêng cho /to-dieu-tri tại đây
})();
