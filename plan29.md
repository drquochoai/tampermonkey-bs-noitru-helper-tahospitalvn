Ah!!! My previous revert command reset it to `355a28d` so the original code is BACK!
And the user said: "logic bây giờ đơn giản thôi bạn ơi: Khi refreshPatientCards kích hoạt: làm y chang như luồn dashboard load lần đầu. Đơn giản vậy thôi là được rồi, tại sao phải tạo mới card làm chi."

In the original code:
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
If I just replace it with:
```javascript
                        // Update surgery status icon
                        DomUpdaters.updateSurgeryIcon(card, item);
                    });

                    // Update y lệnh tags, dataset properties and discharge animation
                    try {
                        if (typeof window.updatePatientCardTags === 'function') {
                            window.updatePatientCardTags(item.mabn);
                        } else if (typeof updatePatientCardTags === 'function') {
                            updatePatientCardTags(item.mabn);
                        }
                    } catch (_) { }
```
This is EXACTLY what I concluded was the best fix!
I will do this now.
