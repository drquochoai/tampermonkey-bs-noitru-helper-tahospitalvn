# Dashboard UI Enhancements Implementation Plan

## Proposal
1. **Extend Search to Tracking List**
   - Modify [applyFilter](file:///d:/_VSCODE_Git/tampermonkey-bs-noitru-helper-tahospitalvn/src/pages/page.dashboard.js#973-1044) in [src/pages/page.dashboard.js](file:///d:/_VSCODE_Git/tampermonkey-bs-noitru-helper-tahospitalvn/src/pages/page.dashboard.js) to also query cards inside `#dr-tracking-active-list`.
   - Ensure the search keywords and advanced filters apply to them just like the main cards.
2. **Add Sort Icon next to "Lọc" menu**
   - In [src/components/advancedFilter.js](file:///d:/_VSCODE_Git/tampermonkey-bs-noitru-helper-tahospitalvn/src/components/advancedFilter.js) or [page.dashboard.js](file:///d:/_VSCODE_Git/tampermonkey-bs-noitru-helper-tahospitalvn/src/pages/page.dashboard.js) (where top-bar is built), insert a new UI element for sorting.
   - It will be a dropdown button with an icon (e.g., `fas fa-sort-amount-down-alt`).
   - Hover menu options: 
     - Sắp xếp theo ngày nhập viện (tăng dần)
     - Sắp xếp theo ngày nhập viện (giảm dần)
     - Sắp xếp theo tổng số ngày nằm viện (tăng dần)
     - Sắp xếp theo tổng số ngày nằm viện (giảm dần)
   - Implement the actual sorting logic rearranging cards in the DOM.
3. **Rename "Lọc nâng cao" to "Lọc" and make it responsive**
   - Inside [src/components/advancedFilter.js](file:///d:/_VSCODE_Git/tampermonkey-bs-noitru-helper-tahospitalvn/src/components/advancedFilter.js), change the innerHTML of `filterBtn` to use `Lọc` instead of `Lọc nâng cao`.
   - Update CSS media queries in [src/pages/page.dashboard.support.js](file:///d:/_VSCODE_Git/tampermonkey-bs-noitru-helper-tahospitalvn/src/pages/page.dashboard.support.js) to make the sort button, the filter button, `dr-view-dropdown-container` and `dr-tracking-btn` visually consistent and shrink their text/padding on smaller screens to fit the top bar.

## Verification
- Reload the dashboard and type in `dr-search-input` to verify tracking list cards are hidden when they don't match.
- Hover over the new sort icon and check the dropdown menu items. Click them and ensure the main container cards are reordered correctly.
- Resize window to check responsiveness of top bar buttons.
