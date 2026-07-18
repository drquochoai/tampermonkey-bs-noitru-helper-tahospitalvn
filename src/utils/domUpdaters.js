// domUpdaters.js - shared UI update helpers for both card and list rows

const { createYLenhTags, updateMedsDoneBadge } = require('./tagUtils');
const { addSurgeryStatusIcon, formatSurgeryInfo } = require('./surgeryUtils');
const { escapeHtml } = require('./htmlUtils');

function getPatientIdentifiers(patientOrId) {
    const ids = [];
    if (patientOrId == null) return ids;
    if (typeof patientOrId === 'object') {
        [patientOrId.mabn, patientOrId.pid, patientOrId.maBN, patientOrId.ma_benh_nhan].forEach((v) => {
            const s = v == null ? '' : String(v).trim();
            if (s && !ids.includes(s)) ids.push(s);
        });
    } else {
        const s = String(patientOrId).trim();
        if (s) ids.push(s);
    }
    return ids;
}

function findPatientElement(patientOrId) {
    const ids = getPatientIdentifiers(patientOrId);
    if (!ids.length) return null;

    for (const id of ids) {
        const direct = document.querySelector(`.dr-card[data-mabn="${id}"]`) || document.querySelector(`.dr-list-row[data-mabn="${id}"]`);
        if (direct) return direct;
    }

    const allCards = Array.from(document.querySelectorAll('.dr-card, .dr-list-row'));
    for (const card of allCards) {
        const cardId = String(card.getAttribute('data-mabn') || '').trim();
        if (cardId && ids.includes(cardId)) return card;
        const text = (card.textContent || card.innerText || '').trim();
        if (text && ids.some((id) => text.includes(id))) return card;
    }

    return null;
}

function updateHXT(patient) {
    try {
        const el = findPatientElement(patient && patient.mabn);
        if (!el) return;
        const hxtText = (patient.checklistState && patient.checklistState.huongXuTri) ? String(patient.checklistState.huongXuTri).trim() : '';
        const old = el.querySelector('.dr-hxt-block');
        if (old) old.remove();
        if (!hxtText) return;
        const div = document.createElement('div');
        div.className = 'dr-value dr-hxt-block';
        div.innerHTML = `<span class="dr-label"><b>HXT:</b></span> ${escapeHtml(hxtText)}`;
        if (el.classList.contains('dr-card')) {
            const ptInfoEl = el.querySelector('.dr-pt-info');
            const cdEl = el.querySelector('.dr-diagnosis-line');
            if (ptInfoEl) ptInfoEl.insertAdjacentElement('afterend', div);
            else if (cdEl) cdEl.insertAdjacentElement('afterend', div);
            else el.insertAdjacentElement('afterbegin', div);
        } else {
            const dxEl = el.querySelector('.dr-list-dx');
            if (dxEl) dxEl.insertAdjacentElement('afterend', div);
            else el.insertAdjacentElement('afterbegin', div);
        }
    } catch (_) {}
}

/**
 * Compose diagnosis strings consistently.
 * Returns baseText (primary diagnosis + optional ICD in parentheses)
 * and combinedHtml which appends CDKT (clamped span) when present.
 */
function composeDiagnosis(patient) {
    const icdSuffix = patient && patient.maicdvk ? ` (${String(patient.maicdvk).trim()})` : '';
    const baseText = `${(patient && patient.chandoanvk) ? patient.chandoanvk : ''}${icdSuffix}`;
    let cdktText = (patient && patient.checklistState && typeof patient.checklistState.chanDoanKemTheo === 'string')
        ? patient.checklistState.chanDoanKemTheo.trim()
        : '';
    if (cdktText) {
        cdktText = cdktText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('; ');
    }
    const combinedHtml = `${baseText}${cdktText ? '; <span class="dr-cdkt-clamp">' + escapeHtml(cdktText) + '</span>' : ''}`;
    return { baseText, cdktText, combinedHtml };
}

function updateCDKT(patient) {
    try {
        const el = findPatientElement(patient && patient.mabn);
        if (!el) return;
        const diagnosisLine = el.querySelector('.dr-diagnosis-line');
        if (!diagnosisLine) return;
        const { baseText, cdktText, combinedHtml } = composeDiagnosis(patient);
        diagnosisLine.dataset.baseCd = baseText;
        diagnosisLine.dataset.cdkt = cdktText;
        diagnosisLine.innerHTML = `<span class="dr-label">Chẩn đoán:</span> ${combinedHtml}`;
    } catch (_) {}
}

function updateTagsAndMedsBadge(containerEl, patient) {
    try {
        if (!containerEl || !patient) return;
        const existingTags = containerEl.querySelector('.ylenh-tags');
        if (existingTags) existingTags.remove();
        const tagsHtml = createYLenhTags(patient);
        if (tagsHtml) {
            let inserted = false;
            if (containerEl.classList.contains('dr-card')) {
                const btnGroup = containerEl.querySelector('.dr-action-buttons');
                if (btnGroup) { btnGroup.insertAdjacentHTML('beforebegin', tagsHtml); inserted = true; }
            }
            if (!inserted) {
                const left = containerEl.querySelector(':scope > div');
                if (left) left.insertAdjacentHTML('beforeend', tagsHtml);
                else containerEl.insertAdjacentHTML('beforeend', tagsHtml);
            }
        }
        updateMedsDoneBadge(containerEl, patient);
    } catch (_) {}
}

function updateSurgeryInfo(containerEl, patient) {
    try {
        if (!containerEl) return;
        const ptInfoContainer = containerEl.querySelector('.dr-pt-info');
        if (!ptInfoContainer) return;
        const formattedPtInfo = formatSurgeryInfo(patient);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = formattedPtInfo;
        const inner = tempDiv.querySelector('.dr-pt-info');
        if (inner) ptInfoContainer.innerHTML = inner.innerHTML;
    } catch (_) {}
}

function updateSurgeryIcon(containerEl, patient) {
    try { addSurgeryStatusIcon(containerEl, patient); } catch (_) {}
}

module.exports = {
    updateHXT,
    updateCDKT,
    updateTagsAndMedsBadge,
    updateSurgeryInfo,
    updateSurgeryIcon,
    findPatientElement,
    composeDiagnosis,
};
