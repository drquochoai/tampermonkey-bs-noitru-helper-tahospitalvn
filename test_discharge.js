const { checkCelebrationForCard } = require('./src/utils/checklistUtils');
const dischargeUtils = require('./src/utils/dischargeUtils');

// Mock DOM element
class MockCard {
    constructor() { this.classList = new Set(); }
    add(cls) { this.classList.add(cls); }
    remove(cls) { this.classList.delete(cls); }
}

const card = { classList: new MockCard() };

const patient = {
    checklistState: {
        yLenhLog: [
            { q: true, action: 'Xuất viện', expectedDischargeDate: '18/07/2026 12:00' }
        ]
    }
};

// Force today to be 18/07/2026 for the test
dischargeUtils.getTodayISODate = () => '2026-07-18';

checkCelebrationForCard(card, patient);
console.log("Classes:", Array.from(card.classList.classList));
