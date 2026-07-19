Wait! The user says "vẫn chưa được" (still not working).
If `updatePatientCardTags` is called for every `item` in `refreshPatientCards`, what could go wrong?

Let's look at `updatePatientCardTags` again:
```javascript
// Global function to update patient card tags
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
Wait! Is `window.dr_data` fully updated before `refreshPatientCards` is called?
In `runDashboardAutoRefresh`:
```javascript
            const basicFresh = await PatientService.fetchPatientData();
            if (!basicFresh || !Array.isArray(basicFresh)) return;

            const enrichedFresh = await PatientService.enrichPatientDataWithChecklist(basicFresh);
            if (!enrichedFresh || !Array.isArray(enrichedFresh)) return;

            window.dr_data = enrichedFresh;
            window.dr_data_khoa_id = activeKhoaId;

            const filteredFresh = filterDataByAccessibleKhoa(enrichedFresh, dashboardCloudContext.settings || {});
            const refreshFn = (typeof globalThis.refreshPatientCards === 'function')
                ? globalThis.refreshPatientCards
                : null;
            ...
            if (refreshFn) {
                refreshFn(filteredFresh);
            }
```
Yes, `window.dr_data` is updated to `enrichedFresh`.
Then `updatePatientCardTags` is called with `item.mabn`.
Then `patient` is found from `window.dr_data`.
Then it finds ALL `targetCards` for this `patientMabn` using `document.querySelectorAll`.
Then for each `targetCard`:
1. Removes `.ylenh-tags`.
2. Creates `tagsHtml` via `createYLenhTags(patient)`.
3. Inserts it.
4. Updates `dataset.hasxv` and `dataset.hascls`.
5. Calls `checkAndAddCelebrationClass(targetCard, patient)`.
6. Calls `updateMedsDoneBadge(targetCard, patient)`.

Wait, in `refreshPatientCards`, it ALREADY iterates over `matchedCards`:
```javascript
                    matchedCards.forEach(card => {
                        ...
                        try {
                            if (typeof window.updatePatientCardTags === 'function') {
                                window.updatePatientCardTags(item.mabn);
                            }
```
If `item` has 2 matched cards (e.g. tracking and main), `matchedCards.forEach` runs TWICE for the same `item.mabn`!
And `window.updatePatientCardTags(item.mabn)` will ALSO query all `targetCards` and iterate over them!
So it will update both cards TWICE!
While slightly inefficient, it SHOULD WORK.

So why doesn't it work?
Let's think.
"Khi refreshPatientCards kích hoạt: làm y chang như luồn dashboard load lần đầu."
Wait! What if the user MEANT:
Instead of trying to selectively update cards, JUST CALL `renderCards` and BE DONE WITH IT?
Let's ask them: "tại sao phải tạo mới card làm chi" -> "Why did you try to update the existing card IN PLACE instead of just re-rendering?".
No! "tạo mới card" literally means "creating new card".
`renderCards` does:
```javascript
        sortedData.forEach((item, index) => {
            const card = renderer(item); // This CREATES A NEW CARD DOM NODE!
            ...
```
If the user means "Why did you create a new card?" they might be complaining about MY changes?
Did I create a new card? No.
Maybe they are complaining about `refreshPatientCards` doing TOO MUCH manually, and they want me to just call `updatePatientCardTags` ONCE per patient, INSTEAD of iterating `matchedCards`?
Wait, if `updatePatientCardTags(item.mabn)` already handles ALL the updating for tags, meds, and celebration class, then doing it INSIDE `matchedCards.forEach` is redundant. We should do it OUTSIDE the loop!

```javascript
            // Update existing cards instead of full re-render to avoid interrupting user
            newData.forEach(item => {
                const matchedCards = item && item.mabn ? cardsByPid.get(item.mabn) : null;
                if (matchedCards) {
                    matchedCards.forEach(card => {
                        decoratePatientFilterTarget(card, item, card.dataset.defaultOrder);
                        ...
                        DomUpdaters.updateHXT(item);
                        DomUpdaters.updateSurgeryIcon(card, item);
                    });

                    // Update y lệnh tags, dataset properties and discharge animation for ALL matching cards
                    try {
                        if (typeof window.updatePatientCardTags === 'function') {
                            window.updatePatientCardTags(item.mabn);
                        } else if (typeof updatePatientCardTags === 'function') {
                            updatePatientCardTags(item.mabn);
                        }
                    } catch (_) { }
                }
            });
```
This is much better.

But why did they say "vẫn chưa được"?
If it updated twice, it should STILL WORK.
Is there any chance that `tagsHtml` is empty, so it doesn't set `dataset.hasxv`?
Wait, I already fixed that in my last patch:
```javascript
        // Update dataset flags for filters (today only)
        try { ...
```
It's OUTSIDE `if (tagsHtml)`. So it always runs.

Wait... Look closely at `updatePatientCardTags` in `tagUtils.js` again.
```javascript
function updatePatientCardTags(patientMabn) {
    ...
    console.log('Looking for patient element (card or row) with mabn:', patientMabn);
    const targetCards = Array.from(document.querySelectorAll(`.dr-card[data-mabn="${patientMabn}"], .dr-list-row[data-mabn="${patientMabn}"], .dr-tracking-item[data-mabn="${patientMabn}"]`));
    ...
    targetCards.forEach(targetCard => {
        ...
        // Update discharge celebration class and meds-done badge regardless of tags presence
        checkAndAddCelebrationClass(targetCard, patient);
        updateMedsDoneBadge(targetCard, patient);
    });
}
```
Does `checkAndAddCelebrationClass` work?
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
If `checklistUtils.js` is NOT available or throws an error during `require` in `tagUtils.js`, it will catch it and log `Error applying celebration class`.
Wait! Is it possible that `require('./checklistUtils')` inside `tagUtils.js` is causing an issue?
In browserify, dynamic requires like this inside a function usually work if the module is statically analyzable.
But wait! `tagUtils.js` doesn't have `const { checkCelebrationForCard } = require('./checklistUtils');` at the top level! It only has it inside the function.
And what if it FAILS?
Did I check the console?
Wait! In `updatePatientCardTags`, we DO THIS EXACT SAME THING during "dashboard load lần đầu" (initial render).
If it works perfectly during initial render, then `checkAndAddCelebrationClass` MUST BE WORKING PERFECTLY.
If it works perfectly for `quick-ylenh-btn`, it MUST BE WORKING PERFECTLY.

Then WHY does it not work for `dr-dashboard-refresh-countdown`?!
"khi nút dr-dashboard-refresh-countdown được ấn hoặc tự ấn khi hết thời gian thì các dr-card có thuộc tính xuất viện không hiện ra xuatvienanimation"
Could it be that the class `.xuatvienanimation` IS added, but it is immediately REMOVED by something else?!
Let's check `runDashboardAutoRefresh` AGAIN!
```javascript
            const refreshFn = (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.refreshPatientCards === 'function')
                ? unsafeWindow.refreshPatientCards
                : (typeof globalThis !== 'undefined' && typeof globalThis.refreshPatientCards === 'function')
                    ? globalThis.refreshPatientCards
                    : (typeof window !== 'undefined' && typeof window.refreshPatientCards === 'function')
                        ? window.refreshPatientCards
                        : null;
...
            if (refreshFn) {
                refreshFn(filteredFresh);
            }
```
Wait, `runDashboardAutoRefresh` calls `refreshFn(filteredFresh)`.
What else does it do?
It sets `dashboardAutoRefreshBusy = false;` and calls `resetDashboardAutoRefreshCountdown();`.
Does `resetDashboardAutoRefreshCountdown()` remove anything? No.
Does `PatientService.enrichPatientDataWithChecklist` do anything?
Wait! `PatientService.enrichPatientDataWithChecklist` has a `setTimeout`:
```javascript
        // Check for celebration animations after enrichment
        setTimeout(() => {
            const checkAllFn = (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.checkAllCelebrationAnimations === 'function')
                ? unsafeWindow.checkAllCelebrationAnimations
                ...
            if (checkAllFn) {
                checkAllFn(enrichedPatients);
            }
        }, 200);
```
Could `checkAllCelebrationAnimations` be REMOVING the class?!
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
If `checkCelebrationForCard(card, patient)` removes the class, it's because:
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
If `dischargeEntries.length === 0`, it REMOVES it!
Why would `dischargeEntries.length === 0` during the 200ms timeout?
Because `enrichedPatients` passed to `checkAllCelebrationAnimations` MIGHT HAVE MUTATED?!
No.
Wait... `isDischargeEntryOnDate(entry, todayIso)`:
What if `todayIso` is evaluated differently?
No.

Wait!!! Look at `enrichPatientDataWithChecklist`!
```javascript
    async enrichPatientDataWithChecklist(patients) {
        ...
        const enrichedPatients = [...patients]; // Copy array to avoid mutation
        ...
```
It returns `enrichedPatients`.
In `runDashboardAutoRefresh`:
```javascript
            const enrichedFresh = await PatientService.enrichPatientDataWithChecklist(basicFresh);
            ...
            const filteredFresh = filterDataByAccessibleKhoa(enrichedFresh, ...);
            ...
            if (refreshFn) {
                refreshFn(filteredFresh);
            }
```
If `refreshFn(filteredFresh)` calls `updatePatientCardTags`, which adds the class.
Then 200ms later, `checkAllCelebrationAnimations(enrichedPatients)` runs.
If `patient` is found in `enrichedPatients`, and it calls `checkCelebrationForCard(card, patient)`.
`patient` is an object in `enrichedPatients`. It's the SAME object as in `filteredFresh`.
So it should ADD the class again.

Wait! What if `dr-dashboard-refresh-countdown` doesn't just call `runDashboardAutoRefresh`?
Is there any other event listener?
```javascript
        const refreshBtn = document.getElementById('dr-dashboard-refresh-countdown');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await runDashboardAutoRefresh();
            });
        }
```
No.

Wait, let me read the user's feedback again.
"vẫn chưa thành công, logic bây giờ đơn giản thôi bạn ơi:
Khi refreshPatientCards kích hoạt: làm y chang như luồn dashboard load lần đầu. Đơn giản vậy thôi là được rồi, tại sao phải tạo mới card làm chi."

The user is telling me to DO EXACTLY WHAT DASHBOARD INITIAL LOAD DOES inside `refreshPatientCards`.
What DOES initial load do?
It creates the card. THEN it calls `updatePatientCardTags(item.mabn)`.
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

In my patched `refreshPatientCards`:
```javascript
            newData.forEach(item => {
                const matchedCards = item && item.mabn ? cardsByPid.get(item.mabn) : null;
                if (matchedCards) {
                    matchedCards.forEach(card => {
                        decoratePatientFilterTarget(card, item, card.dataset.defaultOrder);
                        ...
                        try {
                            if (typeof window.updatePatientCardTags === 'function') {
                                window.updatePatientCardTags(item.mabn);
                            } else if (typeof updatePatientCardTags === 'function') {
                                updatePatientCardTags(item.mabn);
                            }
                        } catch (_) { }
                    });
```
This is ALMOST identical.
But wait! If they are complaining about "tạo mới card làm chi" ("why create new cards"), maybe I DID create new cards?
Did I modify `tagUtils.js` to recreate tags?
```javascript
        // Remove existing tags from anywhere in the element
        const existingTags = targetCard.querySelector('.ylenh-tags');
        if (existingTags) {
            existingTags.remove();
        }
        ...
        // Create new tags
        if (tagsHtml) {
            // Insert tags appropriately
            let placed = false;
            const actionButtons = targetCard.querySelector('.dr-action-buttons');
            if (actionButtons) {
                actionButtons.insertAdjacentHTML('beforebegin', tagsHtml);
                placed = true;
            }
            ...
```
Yes, `updatePatientCardTags` DESTROYS `.ylenh-tags` and RECREATES it.
But that's what it ALWAYS did!

Maybe the user meant: "Why are you calling `updatePatientCardTags` from `window.updatePatientCardTags` instead of just removing the duplicated logic and keeping the original logic?"
Wait, in the original `page.dashboard.js` before ANY of my patches:
```javascript
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
```
If the user wants me to "làm y chang như luồn dashboard load lần đầu", and initial load does:
```javascript
            try {
                if (item && item.mabn && typeof updatePatientCardTags === 'function') {
                    updatePatientCardTags(item.mabn);
                }
            } catch (_) { }
```
Then why did `refreshPatientCards` use `DomUpdaters.updateTagsAndMedsBadge(card, item)`?
BECAUSE `updatePatientCardTags(item.mabn)` only updated the FIRST matched card (until I patched it).
Since I patched `updatePatientCardTags` to update ALL matched cards, we can now SAFELY replace the whole block with `updatePatientCardTags(item.mabn)`!

BUT wait! The user said "tại sao phải tạo mới card làm chi".
If I didn't create a new card, why did they say that?
Maybe the translation is "why do you need to do all these things, just don't create new cards"?
No. "tạo mới card làm chi" means "why create a new card".
Did I accidentally do something that creates a new card?
Let's check `git log` and see what I committed.
I committed:
`Call updatePatientCardTags unconditionally during refreshPatientCards`
`Fix xuatvienanimation class missing after dashboard refresh`
`Remove test dependency jsdom and clean up scratchpad files`

Is it possible that `updatePatientCardTags` is throwing an error?
If it throws an error, it gets caught silently:
```javascript
                    try {
                        if (typeof window.updatePatientCardTags === 'function') {
                            window.updatePatientCardTags(item.mabn);
                        } else if (typeof updatePatientCardTags === 'function') {
                            updatePatientCardTags(item.mabn);
                        }
                    } catch (_) { }
```
If it throws an error, `checkCelebrationForCard` is NEVER CALLED, and the animation NEVER APPEARS!
Why would it throw an error?
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

    // Prefer data-mabn matching on both card and list rows
    console.log('Looking for patient element (card or row) with mabn:', patientMabn);
    const targetCards = Array.from(document.querySelectorAll(`.dr-card[data-mabn="${patientMabn}"], .dr-list-row[data-mabn="${patientMabn}"], .dr-tracking-item[data-mabn="${patientMabn}"]`));
```
Is `document.querySelectorAll` valid? Yes.
Is `targetCards.length === 0` handled? Yes.
Is `createYLenhTags(patient)` valid? Yes.
Is `targetCards.forEach` valid? Yes.

Wait! If `targetCards.forEach(targetCard => {` runs...
In my `tagUtils.patch`, I added:
```javascript
            // Update dataset flags for filters (today only)
            try {
                const todayStr = DateUtils.getTodayStr();
                const todayIso = getTodayISODate();
                const log = patient && patient.checklistState && Array.isArray(patient.checklistState.yLenhLog) ? patient.checklistState.yLenhLog : [];
                ...
            } catch (_) { }
```
Wait! `DateUtils.getTodayStr()` and `getTodayISODate()` are called.
Is `getTodayISODate` defined in `tagUtils.js`?
```javascript
const { getTodayISODate, isDischargeEntry, isDischargeEntryOnDate } = require('./dischargeUtils');
```
Yes, at the top of the file!

Wait, what if `checkAndAddCelebrationClass(targetCard, patient)` is throwing an error?
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
If it throws, it's caught and logged. But does it throw?

Wait... "tại sao phải tạo mới card làm chi"
Is there ANY place where I call `createPatientCard`? No.
Maybe the user noticed the cards were blinking or completely reloading because I called `updatePatientCardTags` inside `refreshPatientCards` which deletes and recreates `.ylenh-tags`?
Well, `DomUpdaters.updateTagsAndMedsBadge` ALSO deletes and recreates `.ylenh-tags`:
```javascript
        const existingTags = containerEl.querySelector('.ylenh-tags');
        if (existingTags) existingTags.remove();
        const tagsHtml = createYLenhTags(patient);
```
So it's the exact same behavior!

What if the user is saying: "In `refreshPatientCards`, instead of looping over `matchedCards` and updating things MANUALLY, just use the SAME logic as the initial load!"
If initial load does:
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
Then what does the user WANT?
Maybe they mean: "just call `updatePatientCardTags(item.mabn)` and let it do its thing. Don't call it inside `matchedCards.forEach`. Just call it ONCE per patient!"
Yes! If we call `updatePatientCardTags` INSIDE `matchedCards.forEach`, we call it TWICE if there are two cards!
And since `updatePatientCardTags` NOW iterates over all target cards itself, calling it TWICE means we update both cards TWICE!
Let's look at `refreshPatientCards`:
```javascript
            newData.forEach(item => {
                const matchedCards = item && item.mabn ? cardsByPid.get(item.mabn) : null;
                if (matchedCards) {
                    matchedCards.forEach(card => {
                        decoratePatientFilterTarget(card, item, card.dataset.defaultOrder);
                        ...
                        DomUpdaters.updateSurgeryIcon(card, item);

                        // Update y lệnh tags, dataset properties and discharge animation
                        try {
                            if (typeof window.updatePatientCardTags === 'function') {
                                window.updatePatientCardTags(item.mabn);
                            } else if (typeof updatePatientCardTags === 'function') {
                                updatePatientCardTags(item.mabn);
                            }
                        } catch (_) { }
                    });

                    try {
                        if (typeof window.__drSyncActiveSidebarState === 'function') {
...
```
If we call `updatePatientCardTags` INSIDE `matchedCards.forEach`, it's inefficient but not broken.

Wait! What if "tại sao phải tạo mới card làm chi" is a DIRECT translation of my code doing something silly?
Did I modify something else?
Let's review the EXACT code differences between now and master.
```bash
git diff origin/master
```
