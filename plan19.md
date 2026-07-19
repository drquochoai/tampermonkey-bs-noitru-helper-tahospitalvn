What if "tạo mới card làm chi" is a literal complaint about `refreshPatientCards` creating new cards?
Is there ANY chance that `refreshPatientCards` is creating new cards?
Let's see:
```javascript
                        // Update merged diagnosis line (Chẩn đoán + CD kèm theo)
                        try {
                            const diagnosisEl = card.querySelector('.dr-diagnosis-line');
                            if (diagnosisEl) {
                                const { composeDiagnosis } = DomUpdaters;
                                const { baseText: baseCdNew, cdktText, combinedHtml } = composeDiagnosis(item);
                                diagnosisEl.dataset.baseCd = baseCdNew;
                                diagnosisEl.dataset.cdkt = cdktText || '';
                                diagnosisEl.innerHTML = `<span class="dr-label">Chẩn đoán:</span> ${combinedHtml}`;
                            }
...
```
No, it just modifies properties.

Wait! Could it be that the user is frustrated because I DID NOT RESTORE `DomUpdaters.updateTagsAndMedsBadge(card, item)`?
Before my patch, `refreshPatientCards` had:
```javascript
                        // Update y lệnh tags if checklistState is available
                        if (item.checklistState) {
                            DomUpdaters.updateTagsAndMedsBadge(card, item);
                        }
```
I REMOVED IT and replaced it with `updatePatientCardTags(item.mabn)`.
And `updatePatientCardTags(item.mabn)` does THIS:
```javascript
    const tagsHtml = createYLenhTags(patient);

    targetCards.forEach(targetCard => {
        // Remove existing tags from anywhere in the element
        const existingTags = targetCard.querySelector('.ylenh-tags');
        if (existingTags) {
            existingTags.remove();
        }

        // Create new tags
        if (tagsHtml) {
            // Insert tags appropriately
            let placed = false;
            const actionButtons = targetCard.querySelector('.dr-action-buttons');
            ...
```
If `updatePatientCardTags` works flawlessly, why did they say "tạo mới card làm chi"?
Maybe "tạo mới card làm chi" means "Why are you calling `updatePatientCardTags` from `window`?".
Or maybe "Why are you recreating the TAGS from scratch?" -> `existingTags.remove();` and then inserting new HTML. But `DomUpdaters.updateTagsAndMedsBadge` does the exact same thing!
Wait! "tạo mới card làm chi" -> "tại sao phải tạo mới card làm chi"
If I translate this idiomatically:
"Why go through the trouble of creating a new card?"
If the user thinks I am creating a new card, they are wrong.
But maybe they are referring to `updatePatientCardTags`?
Wait! In my `updatePatientCardTags` patch, I did:
```javascript
    const tagsHtml = createYLenhTags(patient);
```
And then I iterate over `targetCards`.
Is there anything wrong with that? No.

Wait. What if I just REVERT my changes to `refreshPatientCards` and `tagUtils.js`, and DO WHAT THE USER SAID?
"Khi refreshPatientCards kích hoạt: làm y chang như luồn dashboard load lần đầu."
What does "luồn dashboard load lần đầu" do?
It does exactly this in `renderCards`:
```javascript
        sortedData.forEach((item, index) => {
            const card = renderer(item);
            decoratePatientFilterTarget(card, item, index);
            container.appendChild(card);
            try {
                if (item && item.mabn && typeof updatePatientCardTags === 'function') {
                    updatePatientCardTags(item.mabn);
                }
            } catch (_) { }
        });
```
And the user is saying: "In `refreshPatientCards`, do EXACTLY this. Don't create new cards."
Wait, `renderCards` DOES create new cards! (`const card = renderer(item);`)
If the user says "In `refreshPatientCards`, do exactly what initial load does... but why create new cards?", they mean:
"You should do the exact same logic as `renderCards` does (which is calling `updatePatientCardTags`), but you don't need to create new cards!"
Wait, in my patch, I DID EXACTLY THAT!
I called `updatePatientCardTags(item.mabn)` without creating new cards!

So WHY didn't it work? "vẫn chưa được" (still not working).
If it's STILL not working, then `updatePatientCardTags(item.mabn)` must be FAILING!
Why would `updatePatientCardTags` fail during `refreshPatientCards` but work during `renderCards`?

Let's look at `updatePatientCardTags` again.
```javascript
function updatePatientCardTags(patientMabn) {
    if (!window.dr_data) {
        return;
    }

    // Find patient in data
    const patient = window.dr_data.find(p => p.mabn === patientMabn);
    if (!patient) {
        console.log('Patient not found in dr_data:', patientMabn);
        return;
    }
```
Is `patient` found? Yes.
Is `patient.checklistState` populated?
Wait! What if `window.dr_data` in the sandbox is NOT the same as `window.dr_data` in the DOM?
No, it's all in the sandbox! Tampermonkey executes everything in the sandbox unless specifically exported.
BUT wait! `updatePatientCardTags` is exported to `window.updatePatientCardTags`!
If I call `window.updatePatientCardTags(item.mabn)` from `refreshPatientCards`, it calls the exported function.
Is there any difference? No.

Wait. Let me check the exact behavior of `refreshPatientCards` BEFORE any of my patches.
It called `checkCelebrationForCard(card, item)`.
```javascript
function checkCelebrationForCard(card, patient) {
    if (!patient || !patient.checklistState || !patient.checklistState.yLenhLog) {
        card.classList.remove('xuatvienanimation');
        return;
    }

    const todayIso = getTodayISODate();
    const dischargeEntries = patient.checklistState.yLenhLog.filter(entry => isDischargeEntryOnDate(entry, todayIso));

    if (dischargeEntries.length > 0) {
        card.classList.add('xuatvienanimation');
    } else {
        card.classList.remove('xuatvienanimation');
    }
}
```
Why did THIS not work before my patches?
Because `targetCard.dataset.hasxv` was NOT set!
And when `applyFilter()` was called at the end of `refreshPatientCards`:
```javascript
                    // Delay to allow DOM/class updates done elsewhere
                    setTimeout(() => {
                        applySelectedSort();
                        applyFilter();
                        if (typeof dr_updateFitLayout === 'function') dr_updateFitLayout();
                    }, 0);
```
`applyFilter()` checks `matchesXV`:
```javascript
const matchesXV = !advancedFilterState.onlyXuatVien || card.dataset.hasxv === '1' || card.classList.contains('xuatvienanimation');
```
If `card.classList.contains('xuatvienanimation')` is TRUE, it MATCHES! It should be visible!
So `applyFilter` was NOT hiding it!
Then why was the animation missing?

Wait!
Could `.xuatvienanimation` CSS be defined such that it ONLY works if ANOTHER class is also present?
In `page.dashboard.support.js`:
```css
        .dr-card.xuatvienanimation, .dr-list-row.xuatvienanimation, .dr-tracking-item.xuatvienanimation {
            animation: pulse-border-blue 2s infinite;
        }
```
No.

Wait!!! "khi nút dr-dashboard-refresh-countdown được ấn hoặc tự ấn khi hết thời gian thì các dr-card có thuộc tính xuất viện không hiện ra xuatvienanimation"
What if the user means:
"The cards that DO have the discharge attribute are NOT showing the animation!"
Yes, that's what I've been trying to fix!

What if `refreshPatientCards` is NOT EVEN CALLED for those cards?!
Let's look at `runDashboardAutoRefresh` AGAIN!
```javascript
            const domEls = Array.from(document.querySelectorAll('.dr-card[data-mabn], .dr-list-row[data-mabn]'));
            const domSet = new Set(domEls.map(el => String(el.getAttribute('data-mabn') || '').trim()).filter(Boolean));
            const dataSet = new Set(filteredFresh.map(p => String((p && p.mabn) || '').trim()).filter(Boolean));
            let sameSet = domSet.size === dataSet.size;
            if (sameSet) {
                for (const mabn of dataSet) {
                    if (!domSet.has(mabn)) {
                        sameSet = false;
                        break;
                    }
                }
            }

            const sidebarActive = !!(SidebarSession.getCurrent && SidebarSession.getCurrent().id);
            if (!sameSet && !sidebarActive) {
                renderCards(filteredFresh);
                if (refreshFn) {
                    refreshFn(filteredFresh);
                }
                return;
            }

            if (refreshFn) {
                refreshFn(filteredFresh);
            }
```
If `sameSet` is TRUE, it calls `refreshFn(filteredFresh)`, which calls `refreshPatientCards`.
If `sameSet` is FALSE, it calls `renderCards(filteredFresh)`. Then it calls `refreshFn(filteredFresh)`.
Wait, `renderCards(filteredFresh)` completely destroys the DOM and recreates it.
Then it calls `updatePatientCardTags(item.mabn)`.
Then `refreshFn(filteredFresh)` calls `refreshPatientCards(filteredFresh)`, which iterates over the newly created cards and calls `updatePatientCardTags(item.mabn)` AGAIN!
This is fine.

But WHY is the animation missing?
Let's check if the class `.xuatvienanimation` is somehow removed by something else AFTER `refreshPatientCards` finishes!
What else runs after `refreshPatientCards`?
`applyFilter()` runs. Does it remove the class?
```javascript
        function getCardVisibilityState(card, keywords) {
            ...
        }
        function updateCardDisplay(card, show) {
            if (show) {
                card.style.display = '';
                card.classList.remove('dr-hidden-by-filter');
            } else {
                card.style.display = 'none';
                card.classList.add('dr-hidden-by-filter');
            }
        }
```
No.

What else?
`PatientService.enrichPatientDataWithChecklist(basicFresh)` runs the 200ms timeout!
```javascript
        // Check for celebration animations after enrichment
        setTimeout(() => {
            const checkAllFn = (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.checkAllCelebrationAnimations === 'function')
                ? unsafeWindow.checkAllCelebrationAnimations
                : ...
            if (checkAllFn) {
                checkAllFn(enrichedPatients);
            }
        }, 200);
```
And `checkAllCelebrationAnimations` DOES:
```javascript
function checkAllCelebrationAnimations(enrichedPatients) {
    const cards = document.querySelectorAll('.dr-card, .dr-list-row, .dr-tracking-item');

    cards.forEach((card) => {
        let mabn = card.getAttribute('data-mabn');
        ...
        const patient = enrichedPatients.find(p => p.mabn === mabn);
        if (patient) {
            checkCelebrationForCard(card, patient);
        }
    });
}
```
And `checkCelebrationForCard` DOES:
```javascript
function checkCelebrationForCard(card, patient) {
    if (!patient || !patient.checklistState || !patient.checklistState.yLenhLog) {
        card.classList.remove('xuatvienanimation');
        return;
    }

    const todayIso = getTodayISODate();
    const dischargeEntries = patient.checklistState.yLenhLog.filter(entry => isDischargeEntryOnDate(entry, todayIso));

    if (dischargeEntries.length > 0) {
        card.classList.add('xuatvienanimation');
    } else {
        card.classList.remove('xuatvienanimation');
    }
}
```
If THIS removes the class, it means `dischargeEntries.length === 0`!
WHY WOULD `dischargeEntries.length === 0` FOR A PATIENT WHO HAS A DISCHARGE ENTRY?!
Ah!!!
Because `patient.checklistState.yLenhLog` does NOT have the discharge entry?
Wait! `ChecklistAPIModule.getChecklistData` uses a cache.
If the discharge entry was added locally (e.g., via `quick-ylenh-btn`), it modifies `window.checklistState` and the local `patient` object in `window.dr_data`.
BUT does it update the cache in `ChecklistAPIModule`?
In `ChecklistAPIModule.js`:
```javascript
    async saveChecklistState(checklistObj, checklistState, options = {}) {
        ...
        const ok = result && (result.Status == 1 || result.isValid);

        if (ok) {
            // Invalidate cache on successful save
            _cache.delete(mabn);
```
Yes, it invalidates the cache!
So the next time `getChecklistData` is called, it FETCHES FROM THE SERVER!
Does the server have the discharge entry?
Yes, it was just saved to the server!
So the fetched `checklistObj` HAS the discharge entry in `chuky`.
So `_parseChecklistState` parses it, and returns a `state` object with `yLenhLog` containing the discharge entry.
So `dischargeEntries.length > 0` should be TRUE!

Wait! What if the server DOES NOT return the updated `chuky` immediately?
What if the server has a delay?
If the server has a delay, then fetching immediately after saving might return the OLD `chuky`!
If it returns the old `chuky`, then `yLenhLog` DOES NOT have the discharge entry!
And so `checkCelebrationForCard` REMOVES the class!
Wait! But the user said: "khi quick-ylenh-btn được active thì xuatvienanimation được thêm vào rất đúng."
When `quick-ylenh-btn` is active, it calls `saveYLenhAndRender`, which updates the local state and calls `updatePatientCardTags`, adding the class.
THEN, later, when `dr-dashboard-refresh-countdown` is pressed (e.g., 45 seconds later), it fetches from the server.
By that time, the server DEFINITELY has the updated `chuky`!
So it should fetch the updated `chuky`, which HAS the discharge entry.

So why is it missing?!
Wait! Let's read the user's feedback very carefully again.
"vẫn chưa thành công, logic bây giờ đơn giản thôi bạn ơi:
Khi refreshPatientCards kích hoạt: làm y chang như luồn dashboard load lần đầu. Đơn giản vậy thôi là được rồi, tại sao phải tạo mới card làm chi."

Could "tại sao phải tạo mới card làm chi" literally mean:
"You don't need to do any of this complex DOM updating in `refreshPatientCards`! Just do `updatePatientCardTags(item.mabn)` and you are done!"
Wait! I ALREADY did that in my last patch! I called `updatePatientCardTags(item.mabn)` in `refreshPatientCards`!
Did I leave `DomUpdaters.updateTagsAndMedsBadge`? No, I removed it!
Did I leave `DomUpdaters.updateHXT`? Yes.
Did I leave `DomUpdaters.updateSurgeryIcon`? Yes.
Maybe the user means: "Just put back the old `refreshPatientCards` code, but fix the missing class properly!"
Wait! In the ORIGINAL `refreshPatientCards` before I touched it:
```javascript
                        // Update discharge animation
                        if (typeof checkCelebrationForCard === 'function') {
                            checkCelebrationForCard(card, item);
                        }
```
This was ALREADY in `refreshPatientCards`!
And it ALREADY called `checkCelebrationForCard(card, item)`!
Why did it not work originally?!
Because `checkCelebrationForCard(card, item)` DOES work!
But the user said it doesn't work!
If the original code ALREADY called `checkCelebrationForCard(card, item)`, and it didn't work, then THERE IS A REASON it didn't work.
What is the reason?
Let's check `src/pages/page.dashboard.js` line 2215 again (original code):
```javascript
                        // Update discharge animation
                        if (typeof checkCelebrationForCard === 'function') {
                            checkCelebrationForCard(card, item);
                        }
```
Could `checkCelebrationForCard` be UNDEFINED in `refreshPatientCards`?
If `typeof checkCelebrationForCard === 'function'` is FALSE, it does nothing!
Is `checkCelebrationForCard` defined in `page.dashboard.js`?
```javascript
const { createChecklistItemHTML, copyYLenhText, checkCelebrationForCard, checkAllCelebrationAnimations } = require('../utils/checklistUtils');
```
Yes! It is required at the top!
BUT wait! `page.dashboard.js` is bundled by browserify.
If `checklistUtils.js` has a circular dependency with `page.dashboard.js`, then `checkCelebrationForCard` might be `undefined` at the moment `page.dashboard.js` is evaluated!
Let's check `checklistUtils.js` dependencies:
```javascript
const { showToast, copyToClipboard } = require('./uiUtils');
const ChecklistService = require('../services/checklistService');
const { getTodayISODate, isDischargeEntryOnDate } = require('./dischargeUtils');
```
Does `uiUtils.js` require `page.dashboard.js`? No.
Does `checklistService.js` require `page.dashboard.js`? No.
Does `dischargeUtils.js` require `page.dashboard.js`? No.
So NO circular dependency! `checkCelebrationForCard` IS a function!

If it IS a function, and it IS called, and `dischargeEntries.length > 0` is true, then `card.classList.add('xuatvienanimation')` IS executed!
If it IS executed, why does the user say it's not showing?
Ah!!
Look at `refreshPatientCards` again!
```javascript
            // Update existing cards instead of full re-render to avoid interrupting user
            newData.forEach(item => {
                const matchedCards = item && item.mabn ? cardsByPid.get(item.mabn) : null;
                if (matchedCards) {
                    matchedCards.forEach(card => {
                        decoratePatientFilterTarget(card, item, card.dataset.defaultOrder);
                        ...
```
Does `decoratePatientFilterTarget` RESET the className?!
```javascript
    function decoratePatientFilterTarget(element, item, defaultOrder) {
        if (!element || !item) return element;

        element.__drPatientData = item;

        if (item.mabn) element.setAttribute('data-mabn', item.mabn);
        ...
```
No.

Wait! What if the user is saying:
"In `refreshPatientCards`, instead of updating things one by one, JUST REPLACE THE INNER HTML!"
No, "tại sao phải tạo mới card làm chi" means "why create new cards".

Let's read: "Khi refreshPatientCards kích hoạt: làm y chang như luồn dashboard load lần đầu."
What DOES the dashboard load initially?
```javascript
        sortedData.forEach((item, index) => {
            const card = renderer(item);
            decoratePatientFilterTarget(card, item, index);
            container.appendChild(card);
            try {
                if (item && item.mabn && typeof updatePatientCardTags === 'function') {
                    updatePatientCardTags(item.mabn);
                }
            } catch (_) { }
        });
```
This is EXACTLY what I did in my first patch! I called `updatePatientCardTags`!
Wait. In `updatePatientCardTags`:
```javascript
    const targetCards = Array.from(document.querySelectorAll(`.dr-card[data-mabn="${patientMabn}"], .dr-list-row[data-mabn="${patientMabn}"], .dr-tracking-item[data-mabn="${patientMabn}"]`));
```
I added `Array.from(document.querySelectorAll(...))`.
The original `updatePatientCardTags` ONLY updated ONE card:
```javascript
    let targetCard = document.querySelector(`.dr-card[data-mabn="${patientMabn}"]`) || document.querySelector(`.dr-list-row[data-mabn="${patientMabn}"]`);
```
Is it possible that changing `updatePatientCardTags` to update MULTIPLE cards broke something else?
Or caused a performance issue that the user noticed, making them say "tại sao phải tạo mới card làm chi"?
Maybe `Array.from(document.querySelectorAll)` is too slow when called for EVERY patient during refresh?
If there are 50 patients, it calls `querySelectorAll` 50 times.
But I didn't "create new cards".

Wait! Let me rethink: "tạo mới card làm chi".
If the user means "Why did you create new tags?", as in:
```javascript
        const existingTags = targetCard.querySelector('.ylenh-tags');
        if (existingTags) {
            existingTags.remove();
        }
        ...
        const tagsHtml = createYLenhTags(patient);
```
No, they specifically said "card".

Let's reset everything I did and just look at the original bug.
Bug: "Khi dr-dashboard-refresh-countdown được ấn ... các dr-card không hiện ra xuatvienanimation."
Original `refreshPatientCards`:
```javascript
                        // Update discharge animation
                        if (typeof checkCelebrationForCard === 'function') {
                            checkCelebrationForCard(card, item);
                        }
```
If this was ALREADY there, and it failed, why did it fail?
Let's check `checkCelebrationForCard(card, item)` carefully.
`card` is a DOM element.
`item` is the `patient` object.
```javascript
function checkCelebrationForCard(card, patient) {
    if (!patient || !patient.checklistState || !patient.checklistState.yLenhLog) {
        card.classList.remove('xuatvienanimation');
        return;
    }

    const todayIso = getTodayISODate();
    const dischargeEntries = patient.checklistState.yLenhLog.filter(entry => isDischargeEntryOnDate(entry, todayIso));

    if (dischargeEntries.length > 0) {
        card.classList.add('xuatvienanimation');
    } else {
        card.classList.remove('xuatvienanimation');
    }
}
```
If `item` is passed, `item` comes from `newData` in `refreshPatientCards(newData)`.
`newData` is `filteredFresh`.
Does `item.checklistState` exist?
YES, `PatientService.enrichPatientDataWithChecklist(basicFresh)` adds it.
Does `item.checklistState.yLenhLog` exist?
YES.
Does `dischargeEntries.length > 0` evaluate to TRUE?
YES.
Does `card.classList.add('xuatvienanimation')` get called?
YES.

Then WHY is it not animating?
Because SOMETHING ELSE removes it!
What else modifies `classList` of the card?
In `page.dashboard.js`, `refreshPatientCards`:
```javascript
        const refreshPatientCards = function (newData) {
            ...
```
Does it call `applyFilter`?
Yes:
```javascript
                    setTimeout(() => {
                        applySelectedSort();
                        applyFilter();
                        if (typeof dr_updateFitLayout === 'function') dr_updateFitLayout();
                    }, 0);
```
Does `applyFilter()` remove the class?
```javascript
        function updateCardDisplay(card, show) {
            if (show) {
                card.style.display = '';
                card.classList.remove('dr-hidden-by-filter');
            } else {
                card.style.display = 'none';
                card.classList.add('dr-hidden-by-filter');
            }
        }
```
No.

Does `applySelectedSort()` remove the class?
```javascript
        function applySelectedSort() {
            ...
            mainCards.forEach(c => container.appendChild(c));
            ...
        }
```
`appendChild` moves the element. It does NOT remove classes. BUT moving an element in the DOM CAN RESET CSS ANIMATIONS!
Wait! If an element is moved in the DOM, its CSS animation might restart. But it would still be animated! It wouldn't "không hiện ra" (disappear).

Wait... is there ANY OTHER script that touches `xuatvienanimation`?
```bash
grep -rn "xuatvienanimation" src/
```
