So CSS does NOT require `dataset.hasxv`.
Then why didn't `checkCelebrationForCard` work originally?
Could it be that `item` passed to `checkCelebrationForCard(card, item)` does NOT have the correct properties?
`item` is the object from `newData`.
`checkCelebrationForCard(card, patient)` needs:
`patient.checklistState.yLenhLog`
Does `item` have `checklistState`?
```javascript
                        if (item.checklistState) {
```
Yes.
Then WHY did `checkCelebrationForCard` fail?
What if `checkCelebrationForCard` inside `page.dashboard.js` was bound to an OLD instance of the function, or it threw an error because `getTodayISODate` was undefined?
No, it's defined in `checklistUtils.js`.

Wait. Let me re-read "tại sao phải tạo mới card làm chi"
If I am completely stuck on the translation of "tại sao phải tạo mới card làm chi":
What if the user is saying:
"In `refreshPatientCards`, DO EXACTLY the same thing you did for dashboard load! Just DO THIS:"
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
Wait, if I do exactly that, it WILL create a new card. And the user is asking "tại sao phải tạo mới card làm chi?" which means "Why are you creating a new card?"
Wait, in my previous patch, did I accidentally COMMIT code that creates a new card?
Let's check `git log -p -1`.
