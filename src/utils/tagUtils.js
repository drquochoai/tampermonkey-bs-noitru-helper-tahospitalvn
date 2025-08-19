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

    console.log('Today entries (including quick actions) for patient', patient.mabn, ':', todayEntries);

    if (todayEntries.length === 0) {
        return '';
    }

    // Take only first 3 entries (most recent)
    const displayEntries = todayEntries.slice(0, 3);
    
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

    // Try multiple selectors to find the patient card
    console.log('Looking for patient card with mabn:', patientMabn);
    
    // Look for cards that contain this patient's mabn
    const allCards = document.querySelectorAll('.dr-card');
    console.log('Found total cards:', allCards.length);
    
    let targetCard = null;
    allCards.forEach((card, index) => {
        const cardText = card.textContent || card.innerText || '';
        console.log(`Card ${index} text snippet:`, cardText.substring(0, 100));
        if (cardText.includes(patientMabn)) {
            targetCard = card;
            console.log('Found matching card at index:', index);
        }
    });

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
    
    // Find the action buttons container within this card
    const actionButtons = targetCard.querySelector('.dr-action-buttons');
    if (!actionButtons) {
        console.log('No .dr-action-buttons found in target card');
        return;
    }
    
    // Remove existing tags from anywhere in the card
    const existingTags = targetCard.querySelector('.ylenh-tags');
    if (existingTags) {
        existingTags.remove();
        console.log('Removed existing tags');
    }

    // Create new tags
    const tagsHtml = createYLenhTags(patient);
    if (tagsHtml) {
        // Insert tags before the action buttons
        actionButtons.insertAdjacentHTML('beforebegin', tagsHtml);
        console.log('Inserted new tags before actions container');
        
        // Check if there's a discharge tag and add celebration class to card
        checkAndAddCelebrationClass(targetCard, patient);
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
    } else {
        console.log('No tags to display for patient:', patientMabn);
        // Remove xuatvienanimation class if no tags
        targetCard.classList.remove('xuatvienanimation');
    }
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
    hasDischargeTag 
};
