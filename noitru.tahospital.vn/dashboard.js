// noitru.tahospital.vn/dashboard.js
// Dashboard, sidebar, checklist, upload Google Sheet, ...
(function() {
    if (!/^(bs|dd)-noitru\.tahospital\.vn$/.test(window.location.hostname)) return;
    // Gọi addGlobalStyles nếu cần
    if (window.addGlobalStyles) window.addGlobalStyles();

    // Địa chỉ Google Apps Script API của Bác sĩ
    const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz48_viXo1mjhk-W2CsDbxLuFLFHyD2I7k2UchSmZROjqRC9S4hCRvbNmNOY5nP8HVBnA/exec';

    // ... (Toàn bộ các hàm fetchToDieuTriData, uploadPatientListToGoogleAppsScript, addUploadButtonToGoogleAppsScript, createDirectReportGeneration, showDashboardBenhNhanIfNeeded, createChecklistPhieu, updateChecklistPhieu, addDashboardMenuToSidebar) ...

    // Đặt lại các hàm này vào đây, sử dụng window.Utils và window.addGlobalStyles nếu cần.
    // Gọi addGlobalStyles(); khi cần style.
    // Gọi showDashboardBenhNhanIfNeeded(); khi cần hiển thị dashboard.
    // Gọi addDashboardMenuToSidebar(); khi cần thêm menu vào sidebar.
})();
