// surgeryUtils.js - Surgery-related utility functions

/**
 * Parse surgery date and get detailed info
 * @param {string} surgeryDateStr - Surgery date string
 * @returns {object|null} - Surgery date info
 */
function getSurgeryDateInfo(surgeryDateStr) {
    if (!surgeryDateStr) return null;
    
    // Extract date from surgery date string (format: dd/mm/yyyy or yyyy-mm-dd)
    let surgeryDate;
    if (surgeryDateStr.includes('/')) {
        // Format: dd/mm/yyyy
        const [day, month, year] = surgeryDateStr.split('/');
        surgeryDate = new Date(year, month - 1, day);
    } else if (surgeryDateStr.includes('-')) {
        // Format: yyyy-mm-dd
        surgeryDate = new Date(surgeryDateStr);
    } else {
        return null;
    }
    
    // Get today's date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Set surgery date to start of day
    surgeryDate.setHours(0, 0, 0, 0);
    
    // Calculate days difference
    const timeDiff = today.getTime() - surgeryDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    // Determine status
    let status;
    if (daysDiff > 0) {
        status = 'past'; // Before today
    } else if (daysDiff === 0) {
        status = 'today'; // Today
    } else {
        status = 'future'; // Tomorrow or later
    }
    
    return {
        status: status,
        daysDiff: daysDiff,
        postOpDay: daysDiff >= 0 ? daysDiff : null // Only calculate for past/today surgeries
    };
}

/**
 * Parse surgery date and compare with today (backward compatibility)
 * @param {string} surgeryDateStr - Surgery date string
 * @returns {string|null} - Surgery status
 */
function getSurgeryDateStatus(surgeryDateStr) {
    const info = getSurgeryDateInfo(surgeryDateStr);
    return info ? info.status : null;
}

/**
 * Add surgery status icon to card
 * @param {HTMLElement} card - Patient card element
 * @param {object} item - Patient item
 */
function addSurgeryStatusIcon(card, item) {
    // Remove existing status icon if any
    const existingIcon = card.querySelector('.dr-surgery-status-icon');
    if (existingIcon) {
        existingIcon.remove();
    }
    // Do not show icon for list view rows
    try {
        if (card && card.classList && card.classList.contains('dr-list-row')) return;
    } catch (_) {}
    
    // Get surgery date from item
    let surgeryDate = null;
    if (item.phauThuatInfo) {
        // From new format
        surgeryDate = item.phauThuatInfo.date || item.phauThuatInfo.ngayPhauThuat;
    } else if (item.checklistState && item.checklistState.phauThuatLog && item.checklistState.phauThuatLog.length > 0) {
        // From checklist log (latest surgery)
        surgeryDate = item.checklistState.phauThuatLog[0].date;
    }
    
    const surgeryInfo = getSurgeryDateInfo(surgeryDate);
    if (!surgeryInfo) return;

    // Keep the icon only for surgeries done today.
    if (surgeryInfo.status !== 'today') return;

    // Create icon element
    const iconDiv = document.createElement('div');
    iconDiv.className = 'dr-surgery-status-icon';
    iconDiv.style.cssText = `
        position: absolute;
        top: -4px;
        left: -4px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        z-index: 10;
        pointer-events: none;
    `;

    iconDiv.textContent = '⏸️';
    iconDiv.title = 'Hôm nay PT';
    
    // Add to card
    card.style.position = 'relative';
    card.appendChild(iconDiv);
}

/**
 * Format surgery info with post-op days
 * @param {object} item - Patient item
 * @returns {string} - Formatted surgery info HTML
 */
function formatSurgeryInfo(item) {
    let ptInfo = '';
    let surgeryDate = null;
    let ptData = null;
    
    if (item.phauThuatInfo) {
        ptData = item.phauThuatInfo;
        surgeryDate = ptData.date || ptData.ngayPhauThuat;
    } else if (item.checklistState && item.checklistState.phauThuatLog && item.checklistState.phauThuatLog.length > 0) {
        // Get latest surgery from checklist log
        ptData = item.checklistState.phauThuatLog[0];
        surgeryDate = ptData.date;
    }
    
    if (ptData) {
        let dateTime = '';
        if (ptData.date && ptData.time) {
            // New format from phauThuatHandlers
            dateTime = `${ptData.date} ${ptData.time}`;
        } else if (ptData.ngayPhauThuat && ptData.gioPhauThuat) {
            // Old format
            dateTime = `${ptData.ngayPhauThuat} ${ptData.gioPhauThuat}`;
        } else if (ptData.date) {
            dateTime = ptData.date;
        } else if (ptData.ngayPhauThuat) {
            dateTime = ptData.ngayPhauThuat;
        }
        
        const method = ptData.method || ptData.pppt || '';
        const sourceLabel = ptData.source === 'otm' ? '<span style="color:#1976d2; font-weight:600;">[OTM]</span> ' : 
                           ptData.source === 'manual' ? '<span style="color:#d32f2f; font-weight:600;">[Tay]</span> ' : '';
        
        // Calculate post-op days
        const surgeryInfo = getSurgeryDateInfo(surgeryDate);
        let postOpDisplay = '';
        if (surgeryInfo && surgeryInfo.postOpDay !== null) {
            if (surgeryInfo.status === 'today') {
                postOpDisplay = ` <strong>(Hôm nay PT)</strong>`;
            } else {
                postOpDisplay = ` <strong>(HPN${surgeryInfo.postOpDay})</strong>`;
            }
        } else if (surgeryInfo && surgeryInfo.status === 'future') {
            const daysUntil = Math.abs(surgeryInfo.daysDiff);
            if (daysUntil === 1) {
                postOpDisplay = ` <strong>(Ngày mai phẫu thuật)</strong>`;
            } else if (daysUntil === 2) {
                postOpDisplay = ` <strong>(Ngày mốt PT)</strong>`;
            } else {
                postOpDisplay = ` <strong>(Còn ${daysUntil} ngày nữa PT)</strong>`;
            }
        }
        
        console.log('Surgery info found for patient:', item.mabn, 'PPPT:', method, 'DateTime:', dateTime, 'PostOp:', postOpDisplay);
        
        const doctorsInfo = ptData.doctors ? `<div class="dr-surgeon-line"><span class="dr-label">BS:</span> ${ptData.doctors}</div>` : '';
        ptInfo = `<div class="dr-pt-info">
            <div class="dr-value"><span class="dr-label">PPPT:</span> ${sourceLabel}${method}${postOpDisplay}</div>
            ${doctorsInfo}
            <div class="dr-value"><span class="dr-label">Ngày PT:</span> ${dateTime}</div>
        </div>`;
    } else {
        ptInfo = '<div class="dr-pt-info"></div>';
    }
    
    return ptInfo;
}

/**
 * Update patient card surgery info
 * @param {object} patient - Patient data
 * @param {object} customChecklistState - Custom checklist state
 */
function updatePatientCardPhauThuat(patient, customChecklistState = null) {
    const ids = [patient && patient.mabn, patient && patient.pid, patient && patient.maBN, patient && patient.ma_benh_nhan]
        .map(v => (v == null ? '' : String(v).trim()))
        .filter(Boolean);
    const cards = document.querySelectorAll('.dr-card, .dr-list-row');
    for (let card of cards) {
        const cardMabn = String(card.getAttribute('data-mabn') || '').trim();
        const cardTitle = card.querySelector('h2');
        const cardText = cardTitle ? cardTitle.textContent : (card.textContent || '');
        const matched = (cardMabn && ids.includes(cardMabn)) || (cardText && ids.some((id) => cardText.includes(id)));
        if (matched) {
            const checklistState = customChecklistState || window.checklistState;
            
            // Create patient object with updated checklist state for formatSurgeryInfo
            // Also ensure any existing phauThuatInfo is preserved/updated
            const patientWithState = {
                ...patient,
                checklistState: checklistState
            };
            
            // If checklistState has phauThuatLog, update patient's phauThuatInfo with latest entry
            // Sync patient's phauThuatInfo with latest entry in checklistState.phauThuatLog
            if (checklistState && checklistState.phauThuatLog) {
                if (checklistState.phauThuatLog.length > 0) {
                    const latestPT = checklistState.phauThuatLog[0];
                    patientWithState.phauThuatInfo = {
                        date: latestPT.date,
                        time: latestPT.time,
                        method: latestPT.method,
                        doctors: latestPT.doctors,
                        source: latestPT.source,
                        ngayPhauThuat: latestPT.date,
                        gioPhauThuat: latestPT.time,
                        pppt: latestPT.method
                    };
                } else {
                    // Log is empty, clear phauThuatInfo
                    patientWithState.phauThuatInfo = null;
                }
            }
            
            // Use formatSurgeryInfo to get formatted surgery info with post-op days
            const formattedPtInfo = formatSurgeryInfo(patientWithState);
            
            // Find existing surgery info container and update
            const existingPTContainer = card.querySelector('.dr-pt-info');
            if (existingPTContainer) {
                console.log('PT container found, updating with formatted info');
                // Extract just the inner content from the formatted HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = formattedPtInfo;
                const innerContent = tempDiv.querySelector('.dr-pt-info');
                if (innerContent) {
                    existingPTContainer.innerHTML = innerContent.innerHTML;
                }
                console.log('Updated PT container with post-op days and latest surgery info');
            } else {
                console.log('PT container not found for patient:', patient.mabn);
            }
            
            // Update surgery status icon with the latest info
            addSurgeryStatusIcon(card, patientWithState);
            
            break;
        }
    }
}

module.exports = {
    getSurgeryDateInfo,
    getSurgeryDateStatus,
    addSurgeryStatusIcon,
    formatSurgeryInfo,
    updatePatientCardPhauThuat
};
