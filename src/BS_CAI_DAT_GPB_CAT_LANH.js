// BS_CAI_DAT_GPB_CAT_LANH.js
// Cấu hình cho copy GPB cắt lạnh

const BS_CAI_DAT_GPB_CAT_LANH = {
    defaultExpectedMinutes: 90,
    defaultMongMuonBiet: 'lành/ác',
    defaultFallbackSpecimen: 'Mẫu bệnh phẩm theo chẩn đoán',
    rules: [
        {
            label: 'Giáp',
            keywords: 'giáp',
            matchMode: 'OR',
            mau_benh_pham: 'nhân giáp {laterality}',
            mong_muon_biet: 'Lành/ác, xâm lấn vỏ bao không'
        },
        {
            label: 'U phổi',
            keywords: 'u phổi|phổi',
            matchMode: 'OR',
            mau_benh_pham: 'u {laterality}',
            mong_muon_biet: 'Lành/ác'
        }
    ]
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BS_CAI_DAT_GPB_CAT_LANH;
}

if (typeof window !== 'undefined') {
    window.BS_CAI_DAT_GPB_CAT_LANH = BS_CAI_DAT_GPB_CAT_LANH;
}
