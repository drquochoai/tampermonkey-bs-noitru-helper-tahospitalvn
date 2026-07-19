I will move `updatePatientCardTags` outside of `matchedCards.forEach`.
And I will restore `DomUpdaters.updateTagsAndMedsBadge` inside `matchedCards.forEach` so I don't "recreate" the tags globally if the user was actually complaining about that?
Wait, if I restore `DomUpdaters.updateTagsAndMedsBadge(card, item)`, it ALSO removes and recreates `.ylenh-tags`!
```javascript
        const existingTags = containerEl.querySelector('.ylenh-tags');
        if (existingTags) existingTags.remove();
```
Both functions recreate the tags. So there's no difference.
The only difference is that `updatePatientCardTags` also updates `dataset.hasxv` and calls `checkAndAddCelebrationClass`.

If I call `updatePatientCardTags` outside the loop, it will only execute ONCE per patient.
```javascript
            // Update existing cards instead of full re-render to avoid interrupting user
            newData.forEach(item => {
                const matchedCards = item && item.mabn ? cardsByPid.get(item.mabn) : null;
                if (matchedCards) {
                    matchedCards.forEach(card => {
                        decoratePatientFilterTarget(card, item, card.dataset.defaultOrder);
                        // Update merged diagnosis line (Chẩn đoán + CD kèm theo)
                        ...
                        // Update HXT line in the card/list row
                        DomUpdaters.updateHXT(item);
                        // Update surgery status icon
                        DomUpdaters.updateSurgeryIcon(card, item);
                    });

                    // Update tags, meds badge, datasets, and discharge animation exactly like initial load
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
This is perfectly identical to initial load for the tags/animation.

Wait! Could "làm y chang như luồn dashboard load lần đầu" literally mean:
"Instead of using `DomUpdaters.updateHXT` and `updateSurgeryIcon` and `updatePatientCardTags`... just use `renderCards(newData)`?"
No! Because `renderCards` DOES create new cards! The user explicitly said "why create new cards"! So they DO NOT want `renderCards`.

Let's apply this fix. Move it outside the inner loop!
