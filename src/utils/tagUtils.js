// tagUtils.js
const BS_CAI_DAT = require('../BS_CAI_DAT_GIAO_DIEN');

// Helper function to create y lệnh tags
function createYLenhTags(patient) {
    console.log('DEBUG createYLenhTags - patient:', patient.mabn, 'checklistState:', !!patient.checklistState);
    
    if (!patient.checklistState || !patient.checklistState.yLenhLog || !Array.isArray(patient.checklistState.yLenhLog)) {
        console.log('No yLenhLog found for patient:', patient.mabn);
        return '';
    }

    // Filter for today's entries (INCLUDE all entries for dashboard cards)
    const today = new Date();
    const todayStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    
    const todayEntries = patient.checklistState.yLenhLog.filter(entry => {
        return entry.timestamp && entry.timestamp.startsWith(todayStr);
    });
    // Exclude 'Đã đánh thuốc' from tags (both quick and manual entries)
    const filteredEntries = todayEntries.filter(entry => {
        const text = ((entry.action || entry.content || '') + '').trim().toLowerCase();
        return text !== 'đã đánh thuốc';
    });

    console.log('Today entries (excluding meds-done) for patient', patient.mabn, ':', filteredEntries);

    if (filteredEntries.length === 0) {
        return '';
    }

    // Take only first 3 entries (most recent)
    const displayEntries = filteredEntries.slice(0, 3);
    
    const tagsHtml = displayEntries.map(entry => {
        // Determine tag color based on content
        let color = '#4caf50'; // default green
        const content = (entry.content || '').toLowerCase();
        let isDischarge = false;

        if (content.includes('xuất viện')) {
            color = '#4caf50';
            isDischarge = true;
        }
        else if (content.includes('rút odl')) color = '#ff9800';
        else if (content.includes('sonde')) color = '#9c27b0';
        else if (content.includes('thay băng')) color = '#2196f3';

        // Quick-action state mapping
        let stateClass = '';
        let stateIcon = '📋';
        if (entry.q === true) {
            const st = entry.status || 'active';
            if (st === 'active') { stateClass = ' state-active'; stateIcon = '⏳'; }
            if (st === 'done')   { stateClass = ' state-done';   stateIcon = '✔'; }
        }

        const dischargeClass = isDischarge ? ' discharge' : '';
        const classes = `ylenh-tag${dischargeClass}${stateClass}`;
        // Append discharge time if available and is Xuất viện
        const timeText = (isDischarge && entry.dischargeTime) ? ` (${entry.dischargeTime})` : '';

        return `<span class="${classes}" style="background-color: rgba(${hexToRgb(color)}, 0.1); color: ${color}; border-color: rgba(${hexToRgb(color)}, 0.3);">
            <span class="icon">${stateIcon}</span>
            <span style="overflow-wrap:anywhere; word-break:break-word;">${entry.content}${timeText}</span>
        </span>`;
    }).join('');

    console.log('Generated tags HTML for patient', patient.mabn, ':', tagsHtml);
    
    return `<div class="ylenh-tags">${tagsHtml}</div>`;
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
        '76, 175, 80'; // fallback green
}

// Compute if today has a quick action 'Đã đánh thuốc' marked done
function hasMedsDoneToday(patient) {
    try {
        if (!patient || !patient.checklistState || !Array.isArray(patient.checklistState.yLenhLog)) return false;
        const today = new Date();
        const todayStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
        return patient.checklistState.yLenhLog.some(entry => {
            if (!entry || !entry.timestamp || !entry.content) return false;
            if (!entry.timestamp.startsWith(todayStr)) return false;
            const isQuick = entry.q === true && (entry.action ? entry.action === 'Đã đánh thuốc' : entry.content === 'Đã đánh thuốc');
            const isManual = !entry.q && entry.content === 'Đã đánh thuốc';
            if (isQuick) return entry.status === 'done';
            return isManual; // if someone typed it manually, count it
        });
    } catch (_) { return false; }
}

// Add or remove the meds-done badge on a specific card element
function updateMedsDoneBadge(card, patient) {
    try {
        if (!card) return;
        const shouldShow = hasMedsDoneToday(patient);

        // List view: manage inline badge inside actions, do not use absolute badge
        if (card.classList.contains('dr-list-row')) {
            let corner = card.querySelector('.dr-badge-meds-row-corner');
            if (shouldShow) {
                if (!corner) {
                    corner = document.createElement('span');
                    corner.className = 'dr-badge-meds-row-corner';
                    corner.textContent = 'Đã đánh thuốc';
                    card.appendChild(corner);
                }
            } else if (corner) {
                corner.remove();
            }
            return;
        }

        // Card view: original absolute badge behavior
        const existed = card.querySelector('.dr-badge-meds-done');
        if (shouldShow) {
            if (!existed) {
                const badge = document.createElement('div');
                badge.className = 'dr-badge-meds-done';
                badge.textContent = 'Đã đánh thuốc';
                card.appendChild(badge);
            }
            card.classList.add('meds-done');
        } else if (existed) {
            existed.remove();
            card.classList.remove('meds-done');
        }
    } catch (_) { /* noop */ }
}

// Helper function to check for discharge tags and add xuatvienanimation class
function checkAndAddCelebrationClass(card, patient) {
    if (!patient || !patient.checklistState || !patient.checklistState.yLenhLog) {
        card.classList.remove('xuatvienanimation');
        console.log('No checklistState or yLenhLog for patient:', patient?.mabn);
        return;
    }

    // Check if today's entries include "Xuất viện" (including quick actions)
    const today = new Date();
    const todayStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    
    console.log('DEBUG checkAndAddCelebrationClass - Today:', todayStr);
    console.log('DEBUG checkAndAddCelebrationClass - yLenhLog entries:', patient.checklistState.yLenhLog);
    
    // Check ALL entries (including quick actions) for "xuất viện"
    const dischargeEntries = patient.checklistState.yLenhLog.filter(entry => {
        const hasDischarge = entry.content && entry.content.toLowerCase().includes('xuất viện');
        const isToday = entry.timestamp && entry.timestamp.startsWith(todayStr);
        // If quick action, count both active and done for celebration
        if (entry.q === true && entry.action === 'Xuất viện' && isToday) {
            return entry.status === 'active' || entry.status === 'done';
        }
        
        console.log('DEBUG entry:', entry.content, 'timestamp:', entry.timestamp, 'hasDischarge:', hasDischarge, 'isToday:', isToday);
        
        // Check for today's discharge entries (including quick actions)
        return hasDischarge && isToday;
    });

    console.log('DEBUG discharge entries found:', dischargeEntries);

    if (dischargeEntries.length > 0) {
        card.classList.add('xuatvienanimation');
        console.log('🎉 Added xuatvienanimation class to card for patient:', patient.mabn);
    } else {
        card.classList.remove('xuatvienanimation');
        console.log('❌ No discharge entries found for patient:', patient.mabn);
    }
}

// Global function to update patient card tags
function updatePatientCardTags(patientMabn) {
    console.log('updatePatientCardTags called for patient:', patientMabn);
    
    if (!window.dr_data) {
        console.log('No dr_data found');
        return;
    }

    // Find patient in data
    const patient = window.dr_data.find(p => p.mabn === patientMabn);
    if (!patient) {
        console.log('Patient not found in dr_data:', patientMabn);
        return;
    }

    // Prefer data-mabn matching on both card and list rows
    console.log('Looking for patient element (card or row) with mabn:', patientMabn);
    let targetCard = document.querySelector(`.dr-card[data-mabn="${patientMabn}"]`) || document.querySelector(`.dr-list-row[data-mabn="${patientMabn}"]`);
    if (!targetCard) {
        // Fallback: scan text in .dr-card only (legacy)
        const allCards = document.querySelectorAll('.dr-card');
        allCards.forEach((card) => {
            const cardText = card.textContent || card.innerText || '';
            if (cardText.includes(patientMabn)) targetCard = card;
        });
    }

    if (!targetCard) {
        console.log('Patient card not found in DOM for:', patientMabn);
        console.log('Available card text snippets:');
        allCards.forEach((card, index) => {
            const cardText = card.textContent || card.innerText || '';
            console.log(`  Card ${index}:`, cardText.substring(0, 50));
        });
        return;
    }

    console.log('Found patient card for:', patientMabn);
    
    // Remove existing tags from anywhere in the element
    const existingTags = targetCard.querySelector('.ylenh-tags');
    if (existingTags) {
        existingTags.remove();
        console.log('Removed existing tags');
    }

    // Create new tags
    const tagsHtml = createYLenhTags(patient);
    if (tagsHtml) {
        // Insert tags appropriately
        let placed = false;
        const actionButtons = targetCard.querySelector('.dr-action-buttons');
        if (actionButtons) {
            actionButtons.insertAdjacentHTML('beforebegin', tagsHtml);
            placed = true;
        }
        if (!placed) {
            const left = targetCard.querySelector(':scope > div');
            if (left) left.insertAdjacentHTML('beforeend', tagsHtml);
            else targetCard.insertAdjacentHTML('beforeend', tagsHtml);
        }
        // Update dataset flags for filters (today only)
        try {
            const today = new Date();
            const todayStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
            const log = patient && patient.checklistState && Array.isArray(patient.checklistState.yLenhLog) ? patient.checklistState.yLenhLog : [];
            let hasXV = false, hasCLS = false, hasODL = false;
            for (const e of log) {
                if (!e.timestamp || !e.content) continue;
                if (!e.timestamp.startsWith(todayStr)) continue;
                const c = e.content.toLowerCase();
                if (c.includes('xuất viện')) {
                    if (e.q === true && e.action === 'Xuất viện') {
                        if (e.status === 'active' || e.status === 'done') hasXV = true;
                    } else { hasXV = true; }
                }
                if (c.includes('cận lâm sàng')) hasCLS = true;
                if (c.includes('rút odl')) hasODL = true;
            }
            targetCard.dataset.hasxv = hasXV ? '1' : '0';
            targetCard.dataset.hascls = hasCLS ? '1' : '0';
            targetCard.dataset.hasodl = hasODL ? '1' : '0';
        } catch (_) {}
    }

    // Update discharge celebration class and meds-done badge regardless of tags presence
    checkAndAddCelebrationClass(targetCard, patient);
    updateMedsDoneBadge(targetCard, patient);
}

// Make updatePatientCardTags globally available
if (typeof window !== 'undefined') {
    window.updatePatientCardTags = updatePatientCardTags;
}

// Helper function to check if patient has discharge tag
function hasDischargeTag(patient) {
    if (!patient || !patient.checklistState || !patient.checklistState.yLenhLog) {
        return false;
    }
    
    return patient.checklistState.yLenhLog.some(entry => {
        return entry.content && entry.content.toLowerCase().includes('xuất viện');
    });
}

module.exports = { 
    createYLenhTags, 
    updatePatientCardTags,
    hexToRgb,
    hasDischargeTag,
    hasMedsDoneToday,
    updateMedsDoneBadge
};
