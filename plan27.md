If `checkCelebrationForCard(card, item)` FAILS in `refreshPatientCards`, what if `item` does NOT have `mabn` or `checklistState`?
It DOES have it!

Wait! I see it!
In `refreshPatientCards`:
```javascript
            // Update existing cards instead of full re-render to avoid interrupting user
            newData.forEach(item => {
                const matchedCards = item && item.mabn ? cardsByPid.get(item.mabn) : null;
                if (matchedCards) {
                    matchedCards.forEach(card => {
                        ...
                        // Update discharge animation
                        if (typeof checkCelebrationForCard === 'function') {
                            checkCelebrationForCard(card, item);
                        }
                    });
                }
            });
```
Is `item` the SAME object that is in `window.dr_data`?
Yes, `newData` is `filteredFresh`.
Is `item` the SAME object that `checkAllCelebrationAnimations` finds?
Yes.
Then WHY does the animation NOT APPEAR?
Because `card.classList.add('xuatvienanimation')` is CALLED, but the CSS rule DOES NOT APPLY?!
Let's look at `page.dashboard.support.js`:
```css
        .dr-card.xuatvienanimation, .dr-list-row.xuatvienanimation, .dr-tracking-item.xuatvienanimation {
            animation: pulse-border-blue 2s infinite;
        }
```
If the class is added, the animation MUST APPLY!
Unless the card is completely REMOVED from the DOM and a NEW card is inserted!
But `refreshPatientCards` DOES NOT remove the card!

Wait! "tại sao phải tạo mới card làm chi"
If I am completely misinterpreting the user.
What if `refreshPatientCards` WAS creating new cards before?
```bash
git diff origin/master
```
No, `origin/master` had:
```javascript
        const refreshPatientCards = function (newData) {
            const cardsByPid = new Map();
...
            // Update existing cards instead of full re-render to avoid interrupting user
            newData.forEach(item => {
```
It did NOT create new cards.

Wait, if I DO EXACTLY what `dashboard load lần đầu` does.
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
If I DO EXACTLY THAT inside `refreshPatientCards`, then I WOULD create new cards!
```javascript
        const refreshPatientCards = function (newData) {
            container.innerHTML = '';
            newData.forEach((item, index) => {
                const card = renderer(item);
                decoratePatientFilterTarget(card, item, index);
                container.appendChild(card);
                try {
                    if (item && item.mabn && typeof updatePatientCardTags === 'function') {
                        updatePatientCardTags(item.mabn);
                    }
                } catch (_) { }
            });
        };
```
If I do this, it COMPLETELY replaces `refreshPatientCards` with `renderCards` logic!
But if I do this, I AM creating new cards!
And the user just said: "tại sao phải tạo mới card làm chi" (Why must you create new cards?).
So they DO NOT want me to create new cards!

Let's assume the user is saying: "In `refreshPatientCards`, just call `checkAllCelebrationAnimations` at the end, exactly like `dashboard load lần đầu` does!"
Wait. `dashboard load lần đầu` does NOT call `checkAllCelebrationAnimations` at the end!
It calls `updatePatientCardTags(item.mabn)`, which calls `checkAndAddCelebrationClass(targetCard, patient)`.

Let's look at `updatePatientCardTags` AGAIN.
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
If `updatePatientCardTags` calls `checkAndAddCelebrationClass`, and it works, why did `checkCelebrationForCard` directly in `refreshPatientCards` FAIL?
Because `checkCelebrationForCard` directly in `refreshPatientCards` was called with `(card, item)`.
And `updatePatientCardTags` calls it with `(targetCard, patient)`.
`patient` is found from `window.dr_data`!
Are `patient` and `item` the SAME object?
Yes! `item` comes from `filteredFresh`, which is `enrichedFresh`, which IS `window.dr_data`.
Wait, what if `item` in `refreshPatientCards` is NOT `filteredFresh`?
In `runDashboardAutoRefresh`:
```javascript
            if (refreshFn) {
                refreshFn(filteredFresh);
            }
```
Yes, `newData` in `refreshPatientCards` is `filteredFresh`.

Could it be that `typeof checkCelebrationForCard === 'function'` is FALSE in `refreshPatientCards`?!
I CANNOT stress this enough. If it is FALSE, it silently skips!
Why would it be FALSE?
In `page.dashboard.js`:
```javascript
const { createChecklistItemHTML, copyYLenhText, checkCelebrationForCard, checkAllCelebrationAnimations } = require('../utils/checklistUtils');
```
If `checklistUtils.js` is loaded properly, it's a function.
BUT `refreshPatientCards` is executed from `unsafeWindow` context!
Does `unsafeWindow.refreshPatientCards` retain the closure over `checkCelebrationForCard`?
YES, JavaScript closures work in Tampermonkey.
BUT what if it's evaluated differently?
Let's bypass `typeof checkCelebrationForCard`!
If I just replace it with `checkAllCelebrationAnimations`!

Wait! I see the problem!
In `refreshPatientCards`:
```javascript
                        // Update discharge animation
                        if (typeof checkCelebrationForCard === 'function') {
                            checkCelebrationForCard(card, item);
                        }
```
If the user added the discharge tag manually, `yLenhLog` has the entry.
If `refreshPatientCards` is called, `checkCelebrationForCard(card, item)` is called.
And it ADDS the class.
If it ADDS the class, why doesn't it show?
Because `dataset.hasxv` is '0'!
If `dataset.hasxv` is '0', `applyFilter` DOES NOT show the card if `onlyXuatVien` is true.
But the user said "không hiện ra xuatvienanimation", meaning the card IS visible!

Wait, look at this:
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
```
It iterates over `.dr-card, .dr-list-row, .dr-tracking-item`.
Then it does:
```javascript
            newData.forEach(item => {
                const matchedCards = item && item.mabn ? cardsByPid.get(item.mabn) : null;
                if (matchedCards) {
                    matchedCards.forEach(card => {
                        decoratePatientFilterTarget(card, item, card.dataset.defaultOrder);
                        ...
```
If the user means "làm y chang như luồn dashboard load lần đầu. Đơn giản vậy thôi là được rồi, tại sao phải tạo mới card làm chi."
Maybe they are referring to `const card = renderer(item);`?!
Where did I put `const card = renderer(item)`?!
I DID NOT!
But wait, what if I DID put `const card = renderer(item)` in my patch?
Let's check `git log -p -1 48e65a1` again.
I DID NOT!

Wait! "tại sao phải tạo mới card làm chi" -> "Why must we create new cards?"
Maybe they are asking a rhetorical question about the master branch's logic?
"The logic now is simple: When `refreshPatientCards` activates, just do the same as initial load. Simple as that, why bother creating new cards?"
They are saying I SHOULD NOT create new cards, but I SHOULD use the same logic as initial load (which is `updatePatientCardTags`).
And that's what I did! I called `updatePatientCardTags`.
But they said "vẫn chưa được" (still not working).

Why did my patch not work?
Because I put `updatePatientCardTags` INSIDE `matchedCards.forEach(card => { ... })`!
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
If I put it INSIDE `matchedCards.forEach`, it executes MULTIPLE TIMES for the same patient!
If it executes multiple times, what happens?
`updatePatientCardTags` calls `targetCards.forEach(...)`.
It removes `.ylenh-tags` and adds it back.
If it executes TWICE, it removes and adds it TWICE.
Maybe doing this so fast causes the CSS animation to break?
Or maybe it just causes a noticeable flicker, which the user interpreted as "creating a new card"?!
YES!!! If `.ylenh-tags` is removed and re-added twice in 1 millisecond, it flickers!
And the user saw the flicker and thought "You are recreating the whole card! Why do that?"
So the user said "tại sao phải tạo mới card làm chi" because they saw the FLICKER!
To avoid the flicker (or double execution), we should call `updatePatientCardTags(item.mabn)` ONLY ONCE per patient!
Outside the `matchedCards.forEach` loop!

Let's do that!
