Ah! Wait. If I look at the diff for `page.dashboard.js`:
```javascript
                        // Update y lệnh tags, dataset properties and discharge animation
                        try {
                            if (typeof window.updatePatientCardTags === 'function') {
                                window.updatePatientCardTags(item.mabn);
                            } else if (typeof updatePatientCardTags === 'function') {
                                updatePatientCardTags(item.mabn);
                            }
                        } catch (_) { }
```
This is inside `matchedCards.forEach(card => { ... })`.
Wait! If `updatePatientCardTags(item.mabn)` is called, it iterates over ALL matching cards for that `mabn` and updates them.
If the patient has 2 matching cards, `matchedCards.forEach` will loop TWICE!
And inside the loop, it calls `updatePatientCardTags(item.mabn)`.
So it will update BOTH cards TWICE!
This is what I thought earlier, but I said "it's inefficient but it shouldn't cause bugs".

But what if the user literally meant: "DO NOT iterate over `matchedCards`, just do EXACTLY what `renderCards` does!"
What does `renderCards` do?
`renderCards` does NOT iterate over `matchedCards`. It iterates over `sortedData` (which is `newData`), creates ONE card, and then calls `updatePatientCardTags(item.mabn)`.
```javascript
        sortedData.forEach((item, index) => {
            const card = renderer(item);
            ...
            try {
                if (item && item.mabn && typeof updatePatientCardTags === 'function') {
                    updatePatientCardTags(item.mabn);
                }
            } catch (_) { }
        });
```

If we are in `refreshPatientCards(newData)`, it looks like this:
```javascript
            // Update existing cards instead of full re-render to avoid interrupting user
            newData.forEach(item => {
                const matchedCards = item && item.mabn ? cardsByPid.get(item.mabn) : null;
                if (matchedCards) {
                    matchedCards.forEach(card => {
                        decoratePatientFilterTarget(card, item, card.dataset.defaultOrder);
                        // Update merged diagnosis line (Chẩn đoán + CD kèm theo)
                        ...
                        DomUpdaters.updateSurgeryInfo(card, item);
                        DomUpdaters.updateHXT(item);
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
                }
            });
```
We should move the `updatePatientCardTags(item.mabn)` OUTSIDE of the `matchedCards.forEach(card => { ... })` loop!
Because `updatePatientCardTags(item.mabn)` is fully capable of finding and updating ALL matching cards itself!
Let's see what happens if I move it outside:
```javascript
            // Update existing cards instead of full re-render to avoid interrupting user
            newData.forEach(item => {
                const matchedCards = item && item.mabn ? cardsByPid.get(item.mabn) : null;
                if (matchedCards) {
                    matchedCards.forEach(card => {
                        decoratePatientFilterTarget(card, item, card.dataset.defaultOrder);
                        ...
                        DomUpdaters.updateSurgeryIcon(card, item);
                    });

                    // Update y lệnh tags, dataset properties and discharge animation ONCE per patient
                    try {
                        if (typeof window.updatePatientCardTags === 'function') {
                            window.updatePatientCardTags(item.mabn);
                        } else if (typeof updatePatientCardTags === 'function') {
                            updatePatientCardTags(item.mabn);
                        }
                    } catch (_) { }
                    ...
```
This is much better and cleaner.

BUT wait. Does this fix the user's issue?
The user said "vẫn chưa được" (still not working).
If the inefficient double-calling STILL DID NOT WORK, why would moving it outside fix it?
Wait! If it was called twice, maybe the first call created the tags, and the second call removed them and recreated them, and somehow that broke the CSS animation?
Or what if "vẫn chưa được" is because of SOMETHING ELSE entirely?

Let's read the whole flow again.
1. User loads dashboard. `renderCards` is called. `updatePatientCardTags` is called. It works.
2. User clicks "quick-ylenh-btn". `saveYLenhAndRender` is called. It calls `updatePatientCardTags`. It works.
3. User clicks `dr-dashboard-refresh-countdown`. `runDashboardAutoRefresh` is called. It fetches data, then calls `refreshPatientCards`.
Wait. In `runDashboardAutoRefresh`:
```javascript
            const refreshFn = (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.refreshPatientCards === 'function')
                ? unsafeWindow.refreshPatientCards
                : ...
            if (refreshFn) {
                refreshFn(filteredFresh);
            }
```
If `refreshPatientCards` calls `updatePatientCardTags(item.mabn)`.
And `updatePatientCardTags` does:
```javascript
    // Find patient in data
    const patient = window.dr_data.find(p => p.mabn === patientMabn);
```
Wait! `window.dr_data` in `updatePatientCardTags` might be from the Tampermonkey context `window`, while `refreshPatientCards` is running in `unsafeWindow`?
Ah!!!
If `updatePatientCardTags` is defined in the bundle, does it use `window.dr_data`?
```javascript
    if (!window.dr_data) {
        return;
    }
```
Yes, it does.
Is `window.dr_data` updated in `runDashboardAutoRefresh`?
```javascript
            window.dr_data = enrichedFresh;
```
If `runDashboardAutoRefresh` is in the bundle, it updates `window.dr_data`.

BUT what if `window.dr_data` in the DOM context (where `updatePatientCardTags` might execute if it's called via `unsafeWindow`) is NOT updated?
No, the bundle runs in the Tampermonkey sandbox. `window` is the sandbox global.
Wait! `runDashboardAutoRefresh` does:
```javascript
            window.dr_data = enrichedFresh;
            window.dr_data_khoa_id = activeKhoaId;
```
It updates the sandbox `window`.
Then it calls `refreshFn`, which is `unsafeWindow.refreshPatientCards`.
`unsafeWindow.refreshPatientCards` is defined in the SAME bundle!
It was exported like this:
```javascript
        if (typeof unsafeWindow !== 'undefined') {
            unsafeWindow.refreshPatientCards = refreshPatientCards;
```
So it's a closure over the bundle! It executes in the sandbox!
When it calls `updatePatientCardTags(item.mabn)`, it's calling the function inside the sandbox.
And `updatePatientCardTags` checks `window.dr_data`.
Wait, in Tampermonkey, is `window` the sandbox `window` or the page `window`?
Usually, `window` is the sandbox `window`.
If `window.dr_data` is the sandbox `window`, then it has the NEW data (`enrichedFresh`).

Wait... Look closely at `updatePatientCardTags`:
```javascript
    // Find patient in data
    const patient = window.dr_data.find(p => p.mabn === patientMabn);
    if (!patient) {
        console.log('Patient not found in dr_data:', patientMabn);
        return;
    }
```
If it prints `Patient not found in dr_data`, then it fails silently!
Did it fail silently?
Wait! In `refreshPatientCards`, we DO NOT NEED to look up `patient` from `window.dr_data`!
We ALREADY HAVE the `item`!
`newData.forEach(item => { ... })`
`item` IS the patient data!
Why are we forcing `updatePatientCardTags` to look it up AGAIN from `window.dr_data`?
Because `updatePatientCardTags` only accepts `patientMabn` as an argument!
```javascript
function updatePatientCardTags(patientMabn) {
```
If `window.dr_data` is somehow NOT in sync when `refreshPatientCards` runs, then `updatePatientCardTags` will use old data or fail to find the patient!

Wait! Let me read the user's feedback again:
"Khi refreshPatientCards kích hoạt: làm y chang như luồn dashboard load lần đầu. Đơn giản vậy thôi là được rồi, tại sao phải tạo mới card làm chi."
What if the user is literally just saying:
"If it's so hard to update things in place, just call `renderCards(newData)` inside `refreshPatientCards`! Keep it simple!"
Wait... "tại sao phải tạo mới card làm chi" literally translates to "Why do you have to create a new card?"
If the user wanted me to call `renderCards`, they WOULD NOT complain about "creating new cards".
Because `renderCards` DOES create new cards!
So they are saying: "Why did you try to create a new card in `refreshPatientCards`?"
Did I create a new card in my previous patch?
No! I did not.
But maybe my patch broke something and the UI appeared to create new cards?
Or maybe they misread my patch and thought I was creating new cards?
Or maybe they mean: "Why does the original logic try to manually update pieces? Just update the whole list!"
Wait, in Vietnamese, "tạo mới card làm chi" could mean "Why did you create a new card [in your mind/in your approach]?"
Ah! Look at `cardsByPid.get(item.mabn)`.
If a patient was newly admitted, `cardsByPid.has(mabn)` is FALSE.
So `matchedCards` is NULL.
If `matchedCards` is NULL, `refreshPatientCards` does NOTHING for that patient!
Wait! Is that true?
Yes! `refreshPatientCards` only updates EXISTING cards!
```javascript
                const matchedCards = item && item.mabn ? cardsByPid.get(item.mabn) : null;
                if (matchedCards) {
```
If the user expects a NEW patient to appear, `refreshPatientCards` WON'T SHOW THEM!
But `runDashboardAutoRefresh` checks `sameSet`:
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
```
If `sameSet` is false (meaning there are new patients or patients removed), it calls `renderCards(filteredFresh)`, which creates NEW cards for everyone, and THEN calls `refreshFn(filteredFresh)`!
Wait! If it calls `renderCards(filteredFresh)`, then `refreshFn(filteredFresh)` is called immediately after!
And what does `refreshFn` do? It calls `refreshPatientCards`.
So it iterates over all cards and updates them!

But what if "tại sao phải tạo mới card làm chi" means:
"In `refreshPatientCards`, instead of updating things selectively, just re-use the `createPatientCard` function to generate the inner HTML of the card, and replace it?"
No, that's not simple.

Let's just ask the user one more time or implement the fix to move `updatePatientCardTags` outside the loop, as that was a logical bug.
Wait, if `updatePatientCardTags` is called twice, it removes `.ylenh-tags` and recreates it.
If the animation is on the `.dr-card` element, which is the PARENT of `.ylenh-tags`, then removing and recreating `.ylenh-tags` DOES NOT reset the animation on the parent!
So why is the animation missing?

Let's look at `updatePatientCardTags` in `tagUtils.js` AGAIN.
```javascript
        // Update discharge celebration class and meds-done badge regardless of tags presence
        checkAndAddCelebrationClass(targetCard, patient);
        updateMedsDoneBadge(targetCard, patient);
```
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
Is it possible that `patient.checklistState` is UNDEFINED at the moment `refreshPatientCards` is called?
Wait! In `runDashboardAutoRefresh`:
```javascript
            const basicFresh = await PatientService.fetchPatientData();
            if (!basicFresh || !Array.isArray(basicFresh)) return;

            const enrichedFresh = await PatientService.enrichPatientDataWithChecklist(basicFresh);
```
`enrichPatientDataWithChecklist` MUTATES `basicFresh` elements to add `checklistState`.
But wait! `ChecklistAPIModule.getChecklistData(patient)` might return NULL or empty state if it fails!
If it fails, `patient.checklistState` is not set!
If `patient.checklistState` is not set, `checkCelebrationForCard` REMOVES the class!
Why would it fail during auto-refresh?
Because `ChecklistAPIModule.getChecklistData` uses a cache.
If the patient is ALREADY in the cache, it returns the cached state.
Is the patient in the cache?
Yes! `ChecklistAPIModule` caches it.
But wait! What if the cache was INVALIDATED?
Who invalidates the cache?
`ChecklistAPIModule.invalidateCache()`
Is it called?
No, only when saving.

Wait! What if the user meant something completely different:
"làm y chang như luồn dashboard load lần đầu" -> Initial load uses `updatePatientCardTags`.
BUT wait, in `page.dashboard.js`, in `refreshPatientCards`, we had this:
```javascript
                        // Update discharge animation
                        if (typeof checkCelebrationForCard === 'function') {
                            checkCelebrationForCard(card, item);
                        }
```
And now we have:
```javascript
                    // Update y lệnh tags, dataset properties and discharge animation
                    try {
                        if (typeof window.updatePatientCardTags === 'function') {
                            window.updatePatientCardTags(item.mabn);
                        } else if (typeof updatePatientCardTags === 'function') {
                            updatePatientCardTags(item.mabn);
                        }
                    } catch (_) { }
```

Wait... look at the user's latest comment:
"kiểm tra kỹ xem, sao kỳ quá vậy? vẫn chưa được. logic bây giờ đơn giản thôi bạn ơi: Khi refreshPatientCards kích hoạt: làm y chang như luồn dashboard load lần đầu. Đơn giản vậy thôi là được rồi, tại sao phải tạo mới card làm chi."

I think they mean: I shouldn't be calling `updatePatientCardTags` from within `refreshPatientCards`.
Wait, in "dashboard load lần đầu" (`renderCards`):
```javascript
        sortedData.forEach((item, index) => {
            const card = renderer(item);
            ...
            try {
                if (item && item.mabn && typeof updatePatientCardTags === 'function') {
                    updatePatientCardTags(item.mabn);
                }
            } catch (_) { }
        });
```
This is EXACTLY what I did in `refreshPatientCards`! I called `updatePatientCardTags(item.mabn)`!
So what is different?!
Ah! In `refreshPatientCards`, I called it inside `matchedCards.forEach`:
```javascript
                    matchedCards.forEach(card => {
                        ...
                        try {
                            if (typeof window.updatePatientCardTags === 'function') {
                                window.updatePatientCardTags(item.mabn);
                            }
                        } catch (_) { }
                    });
```
If a patient has 2 cards, `updatePatientCardTags` is called TWICE.
Is this what the user means by "tại sao phải tạo mới card làm chi"? No.

Wait. What does `renderer(item)` do?
`renderer(item)` calls `createPatientCard(item)` or `createListRow(item)`.
Inside `createPatientCard(item)` in `cardView.js`, does it check `xuatvienanimation`?
No, it just creates the HTML string.

Let's look at `refreshPatientCards` BEFORE my changes:
```javascript
        const refreshPatientCards = function (newData) {
            const cardsByPid = new Map();
            document.querySelectorAll('.dr-card, .dr-list-row, .dr-tracking-item').forEach(card => {
                const mabn = card.getAttribute('data-mabn');
                if (mabn) {
                    if (!cardsByPid.has(mabn)) {
                        cardsByPid.set(mabn, [card]);
                    } else {
                        cardsByPid.get(mabn).push(card);
                    }
                }
            });

            // Update existing cards instead of full re-render to avoid interrupting user
            newData.forEach(item => {
                const matchedCards = item && item.mabn ? cardsByPid.get(item.mabn) : null;
                if (matchedCards) {
                    matchedCards.forEach(card => {
                        decoratePatientFilterTarget(card, item, card.dataset.defaultOrder);
                        ...
                        DomUpdaters.updateSurgeryInfo(card, item);
                        DomUpdaters.updateHXT(item);
                        DomUpdaters.updateSurgeryIcon(card, item);

                        // Update discharge animation
                        if (typeof checkCelebrationForCard === 'function') {
                            checkCelebrationForCard(card, item);
                        }
                    });
...
```

If the user wants me to do "y chang như luồn dashboard load lần đầu", maybe they just want me to call `checkAllCelebrationAnimations(enrichedPatients)` AFTER `refreshPatientCards` finishes?!
Because "dashboard load lần đầu" (which is `PatientService.enrichPatientDataWithChecklist`) calls:
```javascript
        setTimeout(() => {
            const checkAllFn = (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.checkAllCelebrationAnimations === 'function')
                ...
            if (checkAllFn) {
                checkAllFn(enrichedPatients);
            }
        }, 200);
```
BUT wait! `runDashboardAutoRefresh` ALREADY calls `PatientService.enrichPatientDataWithChecklist(basicFresh)`, which SETS UP THIS TIMEOUT!
So it ALREADY happens 200ms later!

If it happens 200ms later, why is the animation STILL missing?!
Because `checkAllCelebrationAnimations` DOES THIS:
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
If `checkCelebrationForCard(card, patient)` is called, it SHOULD add the class!
Why is it NOT adding the class?!
Could `enrichedPatients.find(p => p.mabn === mabn)` return the WRONG patient?
No.
Could `patient.checklistState.yLenhLog` be empty?
Let's check `isDischargeEntryOnDate` again.
```javascript
    const todayIso = getTodayISODate();
    const dischargeEntries = patient.checklistState.yLenhLog.filter(entry => isDischargeEntryOnDate(entry, todayIso));
```
What if `getTodayISODate()` returns a DIFFERENT date during auto-refresh?
No, it's just `new Date()`.
