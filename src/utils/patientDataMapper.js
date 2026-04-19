// patientDataMapper.js - Centralized patient data mapping

const PatientDataMapper = {
    /**
     * Map raw patient data to standardized format
     */
    mapPatientData(item) {
        return {
            teN_GIUONG: item.teN_GIUONG,
            teN_PHONG: item.teN_PHONG,
            teN_TANG: item.teN_TANG,
            teN_TOANHA: item.teN_TOANHA,
            mabn: item.mabn,
            hoten: item.hoten,
            ngaysinh: item.ngaysinh,
            phai: item.phai,
            mavaovien: item.mavaovien,
            chandoanvk: item.chandoanvk,
            maicdvk: item.maicdvk,
            kehoach: item.kehoach,
            ngayvv: item.ngayvv,
            ngayvk: item.ngayvk,
            tenkpvv: item.tenkpvv,
            tenkhoachuyen: item.tenkhoachuyen,
            makp: item.makp,
            maql: item.maql,
            tungay: item.tungay
        };
    },

    /**
     * Map array of patient data
     */
    mapPatientArray(dataArray) {
        if (!Array.isArray(dataArray)) {
            return [];
        }
        return dataArray.map(item => this.mapPatientData(item));
    },

    /**
     * Determine if room should have white card styling
     */
    isWhiteCard(room) {
        if (!room) return false;

        // Prefer configured list in BS_CAI_DAT.whiteCardRooms when available
        try {
            const cfg = (typeof BS_CAI_DAT !== 'undefined' && BS_CAI_DAT.whiteCardRooms) || null;
            if (Array.isArray(cfg) && cfg.length > 0) {
                const target = this.formatRoom(room).toLowerCase();
                return cfg.some(r => this.formatRoom(r).toLowerCase() === target);
            }
        } catch (e) {
            // ignore and fallback to legacy pattern
        }

        // Fallback (legacy behavior)
        return /^(Phòng )?(214|215|216)$/i.test(room) || /214|215|216/.test(room);
    },

    /**
     * Format room info - extract only room number
     * "Phòng 402" -> "402"
     */
    formatRoom(roomText) {
        if (!roomText) return '';
        // Remove "Phòng " prefix and keep only the number/text
        return roomText.replace(/^Phòng\s*/i, '').trim();
    },

    /**
     * Format bed info - extract only bed letter/name
     * "Giường A" -> "A"
     * "G215-A" -> "A"
     */
    formatBed(bedText) {
        if (!bedText) return '';
        
        // Remove "Giường " prefix first
        let cleaned = bedText.replace(/^Giường\s*/i, '').trim();
        
        // If there's a dash, take only the part after the last dash
        if (cleaned.includes('-')) {
            const parts = cleaned.split('-');
            return parts[parts.length - 1].trim();
        }
        
        // Otherwise return the cleaned text
        return cleaned;
    },

    /**
     * Format floor info - extract only floor number
     * "Tầng 4" -> "4"
     */
    formatFloor(floorText) {
        if (!floorText) return '';
        // Remove "Tầng " prefix and keep only the number
        return floorText.replace(/^Tầng\s*/i, '').trim();
    },

    /**
     * Format building info - extract only building letter/name
     * "Tòa C" -> "C"
     */
    formatBuilding(buildingText) {
        if (!buildingText) return '';
        // Remove "Tòa " prefix and keep only the letter/name
        return buildingText.replace(/^Tòa\s*/i, '').trim();
    },

    /**
     * Format complete room location info
     * Returns formatted string: "402 A - 4 C"
     */
    formatRoomLocation(room, bed, floor, building) {
        const formattedRoom = this.formatRoom(room);
        const formattedBed = this.formatBed(bed);
        const formattedFloor = this.formatFloor(floor);
        const formattedBuilding = this.formatBuilding(building);
        
        let location = '';
        
        // Add room and bed
        if (formattedRoom) {
            location += formattedRoom;
            if (formattedBed) {
                location += `${formattedBed}`;
            }
        }
        
        // Add separator if we have floor or building
        if ((formattedFloor || formattedBuilding) && location) {
            location += ' - ';
        }
        
        // Add floor and building
        if (formattedFloor) {
            location += "Tòa " + formattedFloor;
            if (formattedBuilding) {
                location += `${formattedBuilding}`;
            }
        } else if (formattedBuilding) {
            location += formattedBuilding;
        }
        
        return location;
    },

    /**
     * Extract numeric value from text for sorting
     * "402" -> 402, "A" -> 0, "4C" -> 4
     */
    extractNumericValue(text) {
        if (!text) return 0;
        const match = text.toString().match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    },

    /**
     * Extract alpha value from text for sorting
     * "402A" -> "A", "G215-B" -> "B", "4" -> ""
     */
    extractAlphaValue(text) {
        if (!text) return '';
        // Remove numbers and special characters, keep only letters
        const alpha = text.toString().replace(/[^A-Za-z]/g, '');
        return alpha.toUpperCase();
    },

    /**
     * Sort patients by Building -> Floor -> Room -> Bed (all ascending)
     */
    sortPatients(patients) {
        return patients.sort((a, b) => {
            // 1. Sort by Building (Tòa nhà)
            const buildingA = this.extractAlphaValue(this.formatBuilding(a.teN_TOANHA));
            const buildingB = this.extractAlphaValue(this.formatBuilding(b.teN_TOANHA));
            if (buildingA !== buildingB) {
                return buildingA.localeCompare(buildingB);
            }

            // 2. Sort by Floor (Tầng)
            const floorA = this.extractNumericValue(this.formatFloor(a.teN_TANG));
            const floorB = this.extractNumericValue(this.formatFloor(b.teN_TANG));
            if (floorA !== floorB) {
                return floorA - floorB;
            }

            // 3. Sort by Room number (Phòng)
            const roomA = this.extractNumericValue(this.formatRoom(a.teN_PHONG));
            const roomB = this.extractNumericValue(this.formatRoom(b.teN_PHONG));
            if (roomA !== roomB) {
                return roomA - roomB;
            }

            // 4. Sort by Bed (Giường)
            // First by numeric part, then by alpha part
            const bedA = this.formatBed(a.teN_GIUONG);
            const bedB = this.formatBed(b.teN_GIUONG);
            
            const bedNumA = this.extractNumericValue(bedA);
            const bedNumB = this.extractNumericValue(bedB);
            if (bedNumA !== bedNumB) {
                return bedNumA - bedNumB;
            }
            
            const bedAlphaA = this.extractAlphaValue(bedA);
            const bedAlphaB = this.extractAlphaValue(bedB);
            return bedAlphaA.localeCompare(bedAlphaB);
        });
    },

    /**
     * Map surgery data from checklist state
     */
    mapPhauThuatData(checklistData) {
        if (!checklistData || !checklistData.phauThuatLog) {
            return null;
        }

        const logs = checklistData.phauThuatLog;
        if (!Array.isArray(logs) || logs.length === 0) {
            return null;
        }

        // Get the latest surgery record (first one since newest is first)
        const latestSurgery = logs[0];
        
        return {
            ngayPhauThuat: latestSurgery.date || '', // Already in dd/mm/yyyy format
            gioPhauThuat: latestSurgery.time || '', // Already in HH:MM format
            pppt: latestSurgery.method || '',
            bacSi: latestSurgery.doctors || '',
            timestamp: latestSurgery.id || new Date().getTime()
        };
    },

    /**
     * Check if patient has surgery data
     */
    hasPhauThuatData(checklistData) {
        if (!checklistData || !checklistData.phauThuatLog) {
            return false;
        }

        const logs = checklistData.phauThuatLog;
        return Array.isArray(logs) && logs.length > 0;
    }
};

module.exports = PatientDataMapper;
