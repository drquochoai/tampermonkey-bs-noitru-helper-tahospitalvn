If I update the CSS in `src/pages/page.dashboard.support.js` so that `[data-hasxv="1"]` also gets the animation, it would completely bypass any bugs with `classList.add('xuatvienanimation')`!
Wait, `hasxv` is set to '1' when `isDischargeEntryOnDate` is true!
And `hasxv` is set during `updatePatientCardTags`, which I verified is working!
But wait, why not just fix `checkCelebrationForCard`?
If `checkCelebrationForCard` is not working, WHY?
What if `patient` is undefined?
In `refreshPatientCards`:
```javascript
                        try {
                            if (typeof window.updatePatientCardTags === 'function') {
                                window.updatePatientCardTags(item.mabn);
                            } else if (typeof updatePatientCardTags === 'function') {
                                updatePatientCardTags(item.mabn);
                            }
                        } catch (_) { }
```
`item` is passed to `updatePatientCardTags` via `item.mabn`.
Then `updatePatientCardTags` does:
```javascript
    // Find patient in data
    const patient = window.dr_data.find(p => p.mabn === patientMabn);
```
Wait! What if `window.dr_data` does NOT HAVE the `patient.checklistState` at the moment `refreshPatientCards` is called?
In `runDashboardAutoRefresh`:
```javascript
            const basicFresh = await PatientService.fetchPatientData();
            ...
            const enrichedFresh = await PatientService.enrichPatientDataWithChecklist(basicFresh);
            ...
            window.dr_data = enrichedFresh;
            ...
            if (refreshFn) {
                refreshFn(filteredFresh);
            }
```
It DOES have it! `enrichedFresh` is `window.dr_data`.

Wait! "vẫn chưa thành công, logic bây giờ đơn giản thôi bạn ơi:
Khi refreshPatientCards kích hoạt: làm y chang như luồn dashboard load lần đầu. Đơn giản vậy thôi là được rồi, tại sao phải tạo mới card làm chi."

I'm wondering if I accidentally reverted something or if there's a simple, blatant error.
Let's check what `PatientService.enrichPatientDataWithChecklist` DOES!
```javascript
    async enrichPatientDataWithChecklist(patients) {
        ...
        for (let i = 0; i < patients.length; i += batchSize) {
            ...
            const batchPromises = batch.map(async (patient, batchIndex) => {
                const actualIndex = i + batchIndex;
                try {
                    const result = await ChecklistAPIModule.getChecklistData(patient);
                    if (result && result.state) {
                        enrichedPatients[actualIndex].checklistState = result.state;
                        syncPatientStateToGlobal(patient.mabn, result.state);
```
Wait... `syncPatientStateToGlobal(patient.mabn, result.state)`!
```javascript
function syncPatientStateToGlobal(mabn, newState) {
    try {
        if (!window.dr_data || !mabn) return;
        ...
        p.checklistState = { ...newState };

        try {
            if (typeof window.updatePatientCardTags === 'function') {
                window.updatePatientCardTags(key);
            }
        } catch (_) { }
```
Ah!!! `syncPatientStateToGlobal` calls `window.updatePatientCardTags(key)`!!!
And it does this DURING the `enrichPatientDataWithChecklist` loop!
BUT `window.dr_data` is NOT YET UPDATED in `runDashboardAutoRefresh`!
`window.dr_data` is STILL THE OLD DATA!
So `syncPatientStateToGlobal` updates the OLD `window.dr_data`, and calls `updatePatientCardTags` using the OLD `window.dr_data`!
Then, `updatePatientCardTags` finds the patient in the OLD `window.dr_data`, updates the DOM cards. This works.
THEN `enrichPatientDataWithChecklist` finishes and returns `enrichedFresh`.
THEN `runDashboardAutoRefresh` does:
```javascript
            window.dr_data = enrichedFresh;
```
Now `window.dr_data` is the NEW data.
THEN it calls `refreshPatientCards(filteredFresh)`.
Inside `refreshPatientCards(filteredFresh)`, what does it do?
```javascript
                    matchedCards.forEach(card => {
                        ...
                        DomUpdaters.updateSurgeryIcon(card, item);

                        // Update y lệnh tags, dataset properties and discharge animation
                        try {
                            if (typeof window.updatePatientCardTags === 'function') {
                                window.updatePatientCardTags(item.mabn);
                            }
                        } catch (_) { }
                    });
```
It iterates over `matchedCards` and calls `updatePatientCardTags(item.mabn)` AGAIN!
But this time, `window.dr_data` IS the NEW data!
Does the NEW data have the `checklistState`?
Yes, `enrichedPatients` is returned from `enrichPatientDataWithChecklist`, which has the `checklistState`.

So WHY doesn't it work?
Could it be that the user is saying:
"Because `syncPatientStateToGlobal` ALREADY calls `updatePatientCardTags`, you don't need to call it again in `refreshPatientCards`!"
Wait. If I don't call it in `refreshPatientCards`, then it's exactly what I started with (except I fixed the missing `.dataset.hasxv`!).
Wait, if the user says "tại sao phải tạo mới card làm chi" ("why create new cards"), maybe they literally mean: "Stop modifying my code, just revert your changes to `refreshPatientCards` and fix the root cause!"
What IS the root cause?
If `refreshPatientCards` ALREADY calls `checkCelebrationForCard`, and it doesn't work, maybe the root cause was JUST the `hasxv` bug?
If `hasxv` was fixed, maybe that fixed the whole problem, and they didn't like my refactor of `refreshPatientCards`?
Wait! If `hasxv` is fixed, `applyFilter` won't hide the card. But the animation should STILL show!

Wait, let's look at `runDashboardAutoRefresh` again.
If `sameSet` is TRUE, `refreshPatientCards` runs.
`refreshPatientCards` updates HXT, Surgery Icon, and SHOULD update discharge animation.
In the ORIGINAL code, it did:
```javascript
                        // Update discharge animation
                        if (typeof checkCelebrationForCard === 'function') {
                            checkCelebrationForCard(card, item);
                        }
```
And this DID NOT WORK.
Why did it not work?
Because `item` is `filteredFresh`.
`filteredFresh` comes from `enrichedFresh`.
Does `enrichedFresh` have `checklistState.yLenhLog`?
YES! `enrichPatientDataWithChecklist` adds it!
Wait! Let me look REALLY carefully at `enrichPatientDataWithChecklist`:
```javascript
            const batchPromises = batch.map(async (patient, batchIndex) => {
                const actualIndex = i + batchIndex;
                try {
                    const result = await ChecklistAPIModule.getChecklistData(patient);
                    if (result && result.state) {
                        enrichedPatients[actualIndex].checklistState = result.state;
                        ...
```
Is `patient` in `basicFresh`? Yes.
Does `basicFresh` have `checklistState`? NO.
So `enrichedPatients[actualIndex]` gets `checklistState`.
Then `runDashboardAutoRefresh` does:
```javascript
            const filteredFresh = filterDataByAccessibleKhoa(enrichedFresh, dashboardCloudContext.settings || {});
            const refreshFn = (typeof globalThis.refreshPatientCards === 'function')
                ? globalThis.refreshPatientCards
                : null;
```
What is `filterDataByAccessibleKhoa` doing?
```javascript
function filterDataByAccessibleKhoa(patients, settings) {
    if (!Array.isArray(patients)) return [];
    ...
    return patients.filter(p => { ... });
}
```
It returns a NEW ARRAY of the SAME object references!
So `filteredFresh` contains the exact same objects as `enrichedFresh`.
So `item.checklistState` IS PRESENT.

Then why did `checkCelebrationForCard(card, item)` not add the class?
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
If `card.classList.add` is called, it SHOULD add the class!
What if `todayIso` is WRONG?
`getTodayISODate()` returns `2025-XX-XX`.
What if `entry.expectedDischargeDate` is something else?
If the user added the discharge entry TODAY, it matches `todayIso`.
So it SHOULD match!

Wait! I see it!
In `refreshPatientCards`, it iterates over `newData`.
```javascript
            newData.forEach(item => {
                const matchedCards = item && item.mabn ? cardsByPid.get(item.mabn) : null;
                if (matchedCards) {
                    matchedCards.forEach(card => {
                        ...
                        if (typeof checkCelebrationForCard === 'function') {
                            checkCelebrationForCard(card, item);
                        }
                    });
                }
            });
```
This is a loop inside a loop.
`matchedCards.forEach` runs `checkCelebrationForCard(card, item)`.
This MUST work!

Then WHY did the user say it doesn't work?
Maybe they didn't even click `dr-dashboard-refresh-countdown`! Maybe it refreshed automatically!
"khi nút dr-dashboard-refresh-countdown được ấn hoặc tự ấn khi hết thời gian thì các dr-card có thuộc tính xuất viện không hiện ra xuatvienanimation"
Yes, they did.

Wait. "tại sao phải tạo mới card làm chi"
If I look at my previous patches, I DID NOT create a new card.
But maybe `updatePatientCardTags` CREATES A NEW CARD?!
```javascript
function updatePatientCardTags(patientMabn) {
    ...
    // Prefer data-mabn matching on both card and list rows
    const targetCards = Array.from(document.querySelectorAll(`.dr-card[data-mabn="${patientMabn}"], .dr-list-row[data-mabn="${patientMabn}"], .dr-tracking-item[data-mabn="${patientMabn}"]`));
```
No, it just selects existing cards!

What if the user is complaining about something completely different?
"làm y chang như luồn dashboard load lần đầu. Đơn giản vậy thôi là được rồi, tại sao phải tạo mới card làm chi."
Could it mean: "In `runDashboardAutoRefresh`, just call `renderCards(filteredFresh)` ALWAYS! Why do you bother doing `refreshPatientCards` (which doesn't create new cards)?"
Ah!!!! "tạo mới card làm chi" -> "Why not just create new cards?" (Translation: "Why are you trying to NOT create new cards? Just create them!")
Wait! "tại sao phải tạo mới card làm chi" literally means "Why must you create new cards?" (as in, it's a rhetorical question meaning you SHOULD NOT create new cards).
In Vietnamese, "tạo mới card làm chi" = "what's the point of creating new cards".
Wait, if it means "what's the point of creating new cards", then they DON'T want me to create new cards. They want me to use `refreshPatientCards`.
But if it means "Why did you create new cards [in your code]?", then I MUST have created a new card.
Where did I create a new card?
Nowhere!

What if `refreshPatientCards` is completely fine, but `DomUpdaters.updateTagsAndMedsBadge(card, item)` was somehow REMOVING the `xuatvienanimation` class?
No, it doesn't.

What if the user means:
"In `refreshPatientCards`, instead of updating things selectively, just call the exact same sequence of updates as `renderCards` does, which is `decoratePatientFilterTarget` and `updatePatientCardTags`."
Yes, that's what I did in my SECOND patch.
And it failed!

Let's look at `page.dashboard.js` line 1929:
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
This is what `renderCards` does.
If I do EXACTLY THIS in `refreshPatientCards`, but WITHOUT creating a new card:
```javascript
                    matchedCards.forEach(card => {
                        decoratePatientFilterTarget(card, item, card.dataset.defaultOrder);
                        try {
                            if (typeof window.updatePatientCardTags === 'function') {
                                window.updatePatientCardTags(item.mabn);
                            } else if (typeof updatePatientCardTags === 'function') {
                                updatePatientCardTags(item.mabn);
                            }
                        } catch (_) { }
                    });
```
Wait! If I ONLY do this, then what about `DomUpdaters.updateHXT`, `DomUpdaters.updateSurgeryInfo`, `DomUpdaters.updateSurgeryIcon`, etc.?
Does `updatePatientCardTags` update HXT? NO.
Does it update Surgery Icon? NO.
So I CANNOT just remove those!

Wait, let's restore `refreshPatientCards` to exactly how it was before my patches, and figure out what the true root cause is.
