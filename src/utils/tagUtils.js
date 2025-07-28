// tagUtils.js

// Helper function to create y lệnh tags
function createYLenhTags(patient) {
    console.log('DEBUG createYLenhTags - patient:', patient.mabn, 'checklistState:', !!patient.checklistState);
    
    if (!patient.checklistState || !patient.checklistState.yLenhLog || !Array.isArray(patient.checklistState.yLenhLog)) {
        console.log('No yLenhLog found for patient:', patient.mabn);
        return '';
    }

    // Filter for today's entries
    const today = new Date();
    const todayStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    
    const todayEntries = patient.checklistState.yLenhLog.filter(entry => {
        return entry.timestamp && entry.timestamp.startsWith(todayStr);
    });

    console.log('Today entries for patient', patient.mabn, ':', todayEntries);

    if (todayEntries.length === 0) {
        return '';
    }

    // Take only first 3 entries (most recent)
    const displayEntries = todayEntries.slice(0, 3);
    
    const tagsHtml = displayEntries.map(entry => {
        // Determine tag color based on content
        let color = '#4caf50'; // default green
        const content = entry.content.toLowerCase();
        if (content.includes('xuất viện')) color = '#4caf50';
        else if (content.includes('rút odl')) color = '#ff9800';
        else if (content.includes('sonde')) color = '#9c27b0';
        else if (content.includes('thay băng')) color = '#2196f3';
        
        return `<span class="ylenh-tag" style="background-color: rgba(${hexToRgb(color)}, 0.1); color: ${color}; border-color: rgba(${hexToRgb(color)}, 0.3);">
            <span class="icon">📋</span>
            ${entry.content}
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
    } else {
        console.log('No tags to display for patient:', patientMabn);
    }
}

// Make updatePatientCardTags globally available
if (typeof window !== 'undefined') {
    window.updatePatientCardTags = updatePatientCardTags;
}

module.exports = { 
    createYLenhTags, 
    updatePatientCardTags,
    hexToRgb 
};
