// responsiveDropdown.js - Shared dropdown controller for top bar menus

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function isCompactViewport(breakpoint) {
    try {
        const maxWidthQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
        const coarsePointerQuery = window.matchMedia('(pointer: coarse)');
        return maxWidthQuery.matches || coarsePointerQuery.matches;
    } catch (_) {
        return false;
    }
}

class ResponsiveDropdownController {
    constructor(options = {}) {
        this.breakpoint = Number.isFinite(Number(options.breakpoint)) ? Number(options.breakpoint) : 1180;
        this.zIndex = Number.isFinite(Number(options.zIndex)) ? Number(options.zIndex) : 10050;
        this.entriesById = new Map();
        this.openEntryIds = new Set();
        this.boundDocumentClick = this.handleDocumentClick.bind(this);
        this.boundWindowResize = this.handleViewportChange.bind(this);
        this.boundWindowScroll = this.handleViewportChange.bind(this);
        this.boundKeyDown = this.handleKeyDown.bind(this);
        this.documentListenersAttached = false;
        this.documentClickCapture = true;
        this.windowScrollCapture = true;
    }

    register(config) {
        if (!config || !config.id || !config.container || !config.toggle || !config.menu) return null;

        const entry = {
            id: config.id,
            type: config.type || 'dropdown',
            container: config.container,
            toggle: config.toggle,
            menu: config.menu,
            trigger: config.trigger || config.toggle,
            align: config.align || 'auto',
            breakpoint: Number.isFinite(Number(config.breakpoint)) ? Number(config.breakpoint) : this.breakpoint,
            zIndex: Number.isFinite(Number(config.zIndex)) ? Number(config.zIndex) : this.zIndex,
            openClass: config.openClass || 'open',
            menuPortalParent: null,
            menuPortalNextSibling: null,
            isOpen: false,
            closeTimer: null,
            hoverEnabled: config.hoverEnabled !== false
        };

        this.entriesById.set(entry.id, entry);

        if (entry.toggle && config.bindToggle !== false) {
            entry.toggle.addEventListener('click', (event) => {
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                this.toggle(entry.id);
            });
        }

        return entry;
    }

    registerSubmenu(config) {
        const entry = this.register({
            ...config,
            type: 'submenu',
            trigger: config.trigger || config.toggle || config.menu
        });

        if (!entry) return entry;

        const openOnHover = () => {
            if (!this.shouldUseCompactMode(entry)) {
                this.cancelCloseTimer(entry);
                this.open(entry.id);
            }
        };

        const scheduleClose = () => {
            if (this.shouldUseCompactMode(entry)) return;
            this.scheduleCloseTimer(entry);
        };

        if (entry.trigger && entry.hoverEnabled) {
            entry.trigger.addEventListener('pointerenter', openOnHover);
            entry.trigger.addEventListener('pointerleave', scheduleClose);
            entry.trigger.addEventListener('click', (event) => {
                if (!this.shouldUseCompactMode(entry)) return;
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                this.toggle(entry.id);
            });
        }

        if (entry.menu && entry.hoverEnabled) {
            entry.menu.addEventListener('pointerenter', () => this.cancelCloseTimer(entry));
            entry.menu.addEventListener('pointerleave', scheduleClose);
        }

        return entry;
    }

    shouldUseCompactMode(entryOrId) {
        const entry = typeof entryOrId === 'string' ? this.entriesById.get(entryOrId) : entryOrId;
        if (!entry) return isCompactViewport(this.breakpoint);
        return isCompactViewport(entry.breakpoint);
    }

    isOpen(id) {
        const entry = this.entriesById.get(id);
        return !!(entry && entry.isOpen);
    }

    toggle(id) {
        const entry = this.entriesById.get(id);
        if (!entry) return;
        if (entry.isOpen) this.close(id);
        else this.open(id);
    }

    open(id) {
        const entry = this.entriesById.get(id);
        if (!entry) return;

        this.cancelCloseTimer(entry);
        this.closeAll(entry.id);

        if (!entry.menuPortalParent) {
            entry.menuPortalParent = entry.menu.parentNode;
            entry.menuPortalNextSibling = entry.menu.nextSibling;
        }

        if (entry.menu.parentNode !== document.body) {
            document.body.appendChild(entry.menu);
        }

        entry.container.classList.add(entry.openClass);
        entry.menu.style.display = 'block';
        entry.menu.style.position = 'fixed';
        entry.menu.style.visibility = 'hidden';
        entry.menu.style.opacity = '0';
        entry.menu.style.transform = 'translateY(10px)';
        entry.menu.style.left = '0px';
        entry.menu.style.top = '0px';
        entry.menu.style.right = 'auto';
        entry.menu.style.bottom = 'auto';
        entry.menu.style.zIndex = String(entry.zIndex);
        entry.menu.style.maxHeight = 'calc(100vh - 16px)';
        entry.menu.style.overflowY = 'auto';
        entry.menu.style.overflowX = 'hidden';
        entry.menu.style.boxSizing = 'border-box';

        entry.isOpen = true;
        this.openEntryIds.add(entry.id);
        this.ensureGlobalListeners();

        window.requestAnimationFrame(() => {
            if (!entry.isOpen) return;
            this.position(entry);
            entry.menu.style.opacity = '1';
            entry.menu.style.transform = 'translateY(0)';
            entry.menu.style.visibility = 'visible';
        });
    }

    close(id) {
        const entry = this.entriesById.get(id);
        if (!entry || !entry.isOpen) return;

        this.cancelCloseTimer(entry);
        entry.isOpen = false;
        this.openEntryIds.delete(entry.id);
        entry.container.classList.remove(entry.openClass);
        entry.menu.style.display = 'none';
        entry.menu.style.visibility = '';
        entry.menu.style.opacity = '';
        entry.menu.style.transform = '';
        entry.menu.style.position = '';
        entry.menu.style.left = '';
        entry.menu.style.top = '';
        entry.menu.style.right = '';
        entry.menu.style.bottom = '';
        entry.menu.style.zIndex = '';
        entry.menu.style.maxHeight = '';
        entry.menu.style.overflowY = '';
        entry.menu.style.overflowX = '';
        entry.menu.style.boxSizing = '';

        this.restoreMenu(entry);
        this.cleanupGlobalListeners();
    }

    closeAll(exceptId = null) {
        Array.from(this.openEntryIds).forEach((openId) => {
            if (exceptId && openId === exceptId) return;
            this.close(openId);
        });
    }

    position(entry) {
        const anchor = entry.type === 'submenu' ? entry.trigger : entry.toggle;
        if (!anchor || !entry.menu) return;

        const anchorRect = anchor.getBoundingClientRect();
        const menuRect = entry.menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        const margin = 8;
        const gap = entry.type === 'submenu' ? 6 : 8;
        const compact = this.shouldUseCompactMode(entry);

        let left = anchorRect.left;
        let top = anchorRect.bottom + gap;

        if (entry.type === 'submenu') {
            if (compact) {
                left = anchorRect.left;
                top = anchorRect.bottom + 6;
            } else {
                left = anchorRect.right + gap;
                if (left + menuRect.width > viewportWidth - margin) {
                    left = anchorRect.left - menuRect.width - gap;
                }
                if (left < margin) {
                    left = margin;
                }
                if (top + menuRect.height > viewportHeight - margin) {
                    top = Math.max(margin, viewportHeight - menuRect.height - margin);
                }
            }
        } else {
            if (entry.align === 'right' || (entry.align === 'auto' && left + menuRect.width > viewportWidth - margin)) {
                left = anchorRect.right - menuRect.width;
            }
            if (left + menuRect.width > viewportWidth - margin) {
                left = viewportWidth - menuRect.width - margin;
            }
            if (left < margin) {
                left = margin;
            }
            if (top + menuRect.height > viewportHeight - margin) {
                top = anchorRect.top - menuRect.height - gap;
                if (top < margin) {
                    top = Math.max(margin, viewportHeight - menuRect.height - margin);
                }
            }
        }

        left = clamp(left, margin, Math.max(margin, viewportWidth - menuRect.width - margin));
        top = clamp(top, margin, Math.max(margin, viewportHeight - menuRect.height - margin));

        entry.menu.style.left = `${Math.round(left)}px`;
        entry.menu.style.top = `${Math.round(top)}px`;

        if (compact) {
            entry.menu.style.minWidth = entry.type === 'submenu' ? '180px' : '220px';
            entry.menu.style.maxWidth = `${Math.max(180, viewportWidth - 16)}px`;
        }
    }

    restoreMenu(entry) {
        if (!entry.menuPortalParent) return;

        const parent = entry.menuPortalParent;
        const nextSibling = entry.menuPortalNextSibling;
        if (nextSibling && nextSibling.parentNode === parent) {
            parent.insertBefore(entry.menu, nextSibling);
        } else {
            parent.appendChild(entry.menu);
        }
    }

    handleDocumentClick(event) {
        const target = event.target;
        const openEntries = Array.from(this.openEntryIds)
            .map((id) => this.entriesById.get(id))
            .filter(Boolean);

        const clickedInside = openEntries.some((entry) => {
            return entry.container.contains(target) || entry.menu.contains(target) || entry.toggle.contains(target) || (entry.trigger && entry.trigger.contains(target));
        });

        if (!clickedInside) {
            this.closeAll();
        }
    }

    handleViewportChange() {
        Array.from(this.openEntryIds).forEach((id) => {
            const entry = this.entriesById.get(id);
            if (entry) this.position(entry);
        });
    }

    handleKeyDown(event) {
        if (event.key === 'Escape') {
            this.closeAll();
        }
    }

    scheduleCloseTimer(entry) {
        this.cancelCloseTimer(entry);
        entry.closeTimer = window.setTimeout(() => {
            entry.closeTimer = null;
            this.close(entry.id);
        }, 120);
    }

    cancelCloseTimer(entry) {
        if (entry && entry.closeTimer) {
            window.clearTimeout(entry.closeTimer);
            entry.closeTimer = null;
        }
    }

    ensureGlobalListeners() {
        if (this.documentListenersAttached) return;
        document.addEventListener('click', this.boundDocumentClick, this.documentClickCapture);
        window.addEventListener('resize', this.boundWindowResize, { passive: true });
        window.addEventListener('scroll', this.boundWindowScroll, this.windowScrollCapture);
        document.addEventListener('keydown', this.boundKeyDown, true);
        this.documentListenersAttached = true;
    }

    cleanupGlobalListeners() {
        if (this.openEntryIds.size > 0 || !this.documentListenersAttached) return;
        document.removeEventListener('click', this.boundDocumentClick, this.documentClickCapture);
        window.removeEventListener('resize', this.boundWindowResize);
        window.removeEventListener('scroll', this.boundWindowScroll, this.windowScrollCapture);
        document.removeEventListener('keydown', this.boundKeyDown, true);
        this.documentListenersAttached = false;
    }
}

function createResponsiveDropdownController(options = {}) {
    return new ResponsiveDropdownController(options);
}

module.exports = {
    createResponsiveDropdownController
};
