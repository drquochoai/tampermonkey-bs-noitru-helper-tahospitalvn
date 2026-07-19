Now I am back to square 1.
Let's see what "vẫn chưa thành công, logic bây giờ đơn giản thôi bạn ơi: Khi refreshPatientCards kích hoạt: làm y chang như luồn dashboard load lần đầu. Đơn giản vậy thôi là được rồi, tại sao phải tạo mới card làm chi." REALLY means.

If I look at `refreshPatientCards` in `page.dashboard.js`:
```javascript
            // Update existing cards instead of full re-render to avoid interrupting user
            newData.forEach(item => {
                const matchedCards = item && item.mabn ? cardsByPid.get(item.mabn) : null;
                if (matchedCards) {
                    matchedCards.forEach(card => {
                        ... // LOTS of manual updates
                        DomUpdaters.updateHXT(item);
                        // Update y lệnh tags if checklistState is available
                        if (item.checklistState) {
                            DomUpdaters.updateTagsAndMedsBadge(card, item);
                        }
                        // Update surgery status icon
                        DomUpdaters.updateSurgeryIcon(card, item);
                        // Update discharge animation
                        if (typeof checkCelebrationForCard === 'function') {
                            checkCelebrationForCard(card, item);
                        }
                    });
```
The user is telling me to RE-USE the existing code! "tại sao phải tạo mới card làm chi". This implies they DO NOT WANT new cards. So `refreshPatientCards` updating existing cards is what they want!

But wait, why does it FAIL?
If `refreshPatientCards` is executed, and it does exactly what the initial load does...
Wait! Does it?
In initial load, `updatePatientCardTags` is called.
```javascript
function checkAndAddCelebrationClass(card, patient) {
    try {
        const { checkCelebrationForCard } = require('./checklistUtils');
        if (checkCelebrationForCard) {
            checkCelebrationForCard(card, patient);
        }
    } catch (e) {
        console.error('Error applying celebration class', e);
    }
}
```
In `refreshPatientCards`, it directly calls `checkCelebrationForCard`.
If `checkCelebrationForCard` is working during initial load, it MUST work during refresh, UNLESS the arguments are wrong.
Are the arguments wrong?
`card` is correct.
`item` is the `patient` object.
`item` has `checklistState` and `yLenhLog`.
So `dischargeEntries.length > 0` should be true.
So `card.classList.add('xuatvienanimation')` should be called.

If `card.classList.add('xuatvienanimation')` is called, WHY IS THE ANIMATION NOT SHOWING?
Could it be that the user means: "You don't need to manually call `checkCelebrationForCard` in `refreshPatientCards`! Just call `checkAllCelebrationAnimations` at the end of the `refreshPatientCards` function, just like `enrichPatientDataWithChecklist` does!"
Wait. `checkAllCelebrationAnimations` loops over all cards and calls `checkCelebrationForCard(card, patient)`.
If I call `checkCelebrationForCard(card, item)` manually in the loop, it does the exact same thing!
Why would doing the exact same thing not work?

Wait! Look at `page.dashboard.support.js`:
```css
        .dr-card.xuatvienanimation, .dr-list-row.xuatvienanimation, .dr-tracking-item.xuatvienanimation {
            animation: pulse-border-blue 2s infinite;
        }
```
What if `pulse-border-blue` animation is somehow stopped?
If a card's inner HTML is updated, the animation on the parent does NOT stop.
If the card's classes are updated, it does NOT stop.

Wait... "khi nút dr-dashboard-refresh-countdown được ấn hoặc tự ấn khi hết thời gian thì các dr-card có thuộc tính xuất viện không hiện ra xuatvienanimation"
Could it be that the class IS added, but it's removed by `updatePatientCardTags` WHICH RUNS LATER?!
Wait! `PatientService.enrichPatientDataWithChecklist` runs, then `runDashboardAutoRefresh` updates `window.dr_data` and calls `refreshPatientCards`.
BUT wait! Does `enrichPatientDataWithChecklist` call `updatePatientCardTags`?!
Yes!!!
```javascript
                    const result = await ChecklistAPIModule.getChecklistData(patient);
                    if (result && result.state) {
                        enrichedPatients[actualIndex].checklistState = result.state;
                        syncPatientStateToGlobal(patient.mabn, result.state);
```
And `syncPatientStateToGlobal` calls `window.updatePatientCardTags(key)`.
This runs ASYNCHRONOUSLY during the enrichment loop!
When `updatePatientCardTags` runs, it uses `window.dr_data`.
BUT `window.dr_data` is NOT YET UPDATED! It's the OLD data!
So `updatePatientCardTags` uses the OLD data. It applies the tags and the animation based on the OLD data.
THEN `enrichPatientDataWithChecklist` finishes.
THEN `runDashboardAutoRefresh` sets `window.dr_data = enrichedFresh`.
THEN `refreshPatientCards` runs.
It updates the card again. It adds the animation based on the NEW data.
THEN 200ms later, `checkAllCelebrationAnimations` runs. It adds the animation again.

So WHERE DOES IT REMOVE IT?!
Wait! If `updatePatientCardTags` runs on the OLD data, and the OLD data DID NOT have the discharge entry (because the user just added it via `quick-ylenh-btn` on ANOTHER computer, or whatever), then `updatePatientCardTags` REMOVES the animation!
But wait, if `updatePatientCardTags` REMOVES it, then `refreshPatientCards` ADDS it back! Because `refreshPatientCards` runs AFTER `enrichPatientDataWithChecklist` finishes!
And `refreshPatientCards` uses `filteredFresh` (which is `enrichedFresh`), which HAS the discharge entry!
So `refreshPatientCards` SHOULD add it!

Wait! Does `refreshPatientCards` REALLY add it?!
Let's look at `checkCelebrationForCard(card, item)` inside `refreshPatientCards`.
```javascript
                        // Update discharge animation
                        if (typeof checkCelebrationForCard === 'function') {
                            checkCelebrationForCard(card, item);
                        }
```
Is `typeof checkCelebrationForCard === 'function'` true?
In `src/pages/page.dashboard.js`:
```javascript
const { createChecklistItemHTML, copyYLenhText, checkCelebrationForCard, checkAllCelebrationAnimations } = require('../utils/checklistUtils');
```
Wait! I finally understand the problem.
If `refreshPatientCards` is called via `unsafeWindow.refreshPatientCards`, it executes in the context of the page!
BUT it is a closure! So it has access to `checkCelebrationForCard`!
But what if the reference to `checkCelebrationForCard` is somehow lost or undefined?
No, closures don't work like that.

Let me try to reproduce the problem locally.
I will write a script to simulate the exact auto-refresh process!
