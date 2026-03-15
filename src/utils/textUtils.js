/**
 * Normalizes Vietnamese text by removing diacritics/accents
 * @param {string} str - The string to normalize
 * @returns {string} - The normalized string
 */
function removeAccents(str) {
    if (!str) return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();
}

/**
 * Detects if a string contains Vietnamese diacritics
 * @param {string} str - The string to check
 * @returns {boolean} - True if it has accents
 */
function hasAccents(str) {
    if (!str) return false;
    // Check if normalizing and then removing accents results in a different string
    const normalized = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const hasD = /[đĐ]/.test(str);
    return str.normalize('NFD') !== normalized || hasD;
}

module.exports = {
    removeAccents,
    hasAccents
};
