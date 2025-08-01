// checklistUtils.js - Checklist-related utility functions

const { showToast, copyToClipboard } = require('./uiUtils');
const ChecklistService = require('../services/checklistService');

/**
 * Create checklist item HTML with special actions
 * @param {string} itemText - Item text
 * @param {string} id - Item ID
 * @param {boolean} isChecked - Whether item is checked
 * @param {object} patient - Patient data
 * @returns {string} - HTML string
 */
function createChecklistItemHTML(itemText, id, isChecked, patient) {
    const baseHTML = `<label style="display:flex;align-items:center;gap:8px;"><input type="checkbox" id="${id}" ${isChecked ? 'checked' : ''}>${itemText}</label>`;
    
    // Add special clickable items without checkbox for certain items
    if (itemText === 'Mở HSBA v2') {
        return `
            <div style="display:flex;align-items:center;gap:8px;padding:8px;background:#e3f2fd;border-radius:4px;cursor:pointer;transition:background-color 0.2s;" onclick="openHSBAV2('${patient.mabn}')" onmouseover="this.style.backgroundColor='#bbdefb'" onmouseout="this.style.backgroundColor='#e3f2fd'">
                <span style="color:#1976d2;font-weight:500;">🔗 ${itemText}</span>
                <span style="margin-left:auto;color:#1976d2;font-size:0.8em;">👆 Click để mở</span>
            </div>
        `;
    } else if (itemText === 'Mở trang dặn dò') {
        return `
            <div style="display:flex;align-items:center;gap:8px;padding:8px;background:#fff3e0;border-radius:4px;cursor:pointer;transition:background-color 0.2s;" onclick="window.open('https://hoaiump.notion.site/D-N-D-RA-VI-N-21025280dcee804c971bea55557264b9', '_blank')" onmouseover="this.style.backgroundColor='#ffe0b2'" onmouseout="this.style.backgroundColor='#fff3e0'">
                <span style="color:#f57c00;font-weight:500;">📋 ${itemText}</span>
                <span style="margin-left:auto;color:#f57c00;font-size:0.8em;">👆 Click để mở</span>
            </div>
        `;
    } else if (itemText === 'Thực hiện y lệnh thuốc đã dự trù') {
        const key = `xuatvien_${itemText}`;
        const isCompleted = window.checklistState && window.checklistState[key] || false;
        return `
            <div style="display:flex;align-items:center;gap:8px;padding:8px;background:${isCompleted ? '#e8f5e8' : '#f3e5f5'};border-radius:4px;cursor:pointer;transition:background-color 0.2s;border:${isCompleted ? '2px solid #4caf50' : '1px solid #9c27b0'};" onclick="copyYLenhText('${itemText}', '${id}', '${patient.mabn}')" onmouseover="this.style.backgroundColor='${isCompleted ? '#dcedc8' : '#e1bee7'}'" onmouseout="this.style.backgroundColor='${isCompleted ? '#e8f5e8' : '#f3e5f5'}'">
                <span style="color:${isCompleted ? '#2e7d32' : '#7b1fa2'};font-weight:500;">${isCompleted ? '✅' : '📋'} ${itemText}</span>
                <span style="margin-left:auto;color:${isCompleted ? '#2e7d32' : '#7b1fa2'};font-size:0.8em;">${isCompleted ? '✅ Đã copy' : '👆 Click để copy'}</span>
            </div>
        `;
    }
    
    return baseHTML;
}

/**
 * Copy y lệnh text and mark as completed
 * @param {string} text - Text to copy
 * @param {string} id - Item ID
 * @param {string} mabn - Patient MABN
 */
async function copyYLenhText(text, id, mabn) {
    const success = await copyToClipboard(text);
    
    if (success) {
        // Mark as completed in checklist state
        if (!window.checklistState) {
            window.checklistState = {};
        }
        
        const key = `xuatvien_${text}`;
        window.checklistState[key] = true;
        
        // Save to server
        if (window.checklistObj) {
            const saveSuccess = await ChecklistService.updateChecklistState(window.checklistObj, window.checklistState);
            if (!saveSuccess) {
                console.error('Lưu checklist thất bại!');
            }
        }
        
        // Show success toast
        showToast(`📋 Đã copy: "${text}"`, {
            background: '#4caf50',
            duration: 2500
        });
        
        // Re-render the checklist to show completed state
        setTimeout(() => {
            const xuatvienList = document.querySelector('#checklist-xuatvien');
            if (xuatvienList) {
                const patient = (typeof dr_data !== 'undefined' && dr_data) ? dr_data.find(p => p.mabn === mabn) : null;
                if (patient) {
                    // Try different global scopes for renderChecklistXuatVien function
                    const renderFn = globalThis.renderChecklistXuatVien || 
                                   (typeof unsafeWindow !== 'undefined' && unsafeWindow.renderChecklistXuatVien) ||
                                   (typeof this !== 'undefined' && this.renderChecklistXuatVien) ||
                                   window.renderChecklistXuatVien;
                    if (renderFn) {
                        renderFn(xuatvienList, patient);
                    }
                }
            }
        }, 100);
        
    } else {
        showToast('❌ Không thể copy vào clipboard', {
            background: '#f44336',
            duration: 2000
        });
    }
}

/**
 * Check celebration for card
 * @param {HTMLElement} card - Card element
 * @param {object} patient - Patient data
 */
function checkCelebrationForCard(card, patient) {
    if (!patient || !patient.checklistState || !patient.checklistState.yLenhLog) {
        card.classList.remove('xuatvienanimation');
        return;
    }

    // Check if any entries contain "xuất viện"
    const dischargeEntries = patient.checklistState.yLenhLog.filter(entry => {
        return entry.content && entry.content.toLowerCase().includes('xuất viện');
    });

    if (dischargeEntries.length > 0) {
        card.classList.add('xuatvienanimation');
    } else {
        card.classList.remove('xuatvienanimation');
    }
}

/**
 * Check celebration animations for all cards
 * @param {Array} enrichedPatients - Patient data array
 */
function checkAllCelebrationAnimations(enrichedPatients) {
    const cards = document.querySelectorAll('.dr-card');
    
    cards.forEach((card) => {
        // Get patient MABN from card
        const cardTitle = card.querySelector('h2');
        if (!cardTitle) return;
        
        const cardText = cardTitle.textContent;
        const mabnMatch = cardText.match(/(\d{8,})/); // Find MABN pattern
        if (!mabnMatch) return;
        
        const mabn = mabnMatch[1];
        
        // Find corresponding patient in enriched data
        const patient = enrichedPatients.find(p => p.mabn === mabn);
        if (patient) {
            checkCelebrationForCard(card, patient);
        }
    });
}

module.exports = {
    createChecklistItemHTML,
    copyYLenhText,
    checkCelebrationForCard,
    checkAllCelebrationAnimations
};
