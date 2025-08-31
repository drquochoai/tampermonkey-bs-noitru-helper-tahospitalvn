// saveQueue.js - Offline queue for checklist saves

const QUEUE_KEY = 'dr_save_queue_v1';

function loadQueue() {
    try {
        const raw = localStorage.getItem(QUEUE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch (_) {
        return [];
    }
}

function saveQueue(arr) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(arr)); } catch (_) {}
}

// Keep only the latest item per mabn (dedupe)
function upsertByMabn(queue, item) {
    const idx = queue.findIndex(q => q.mabn === item.mabn);
    if (idx >= 0) queue[idx] = item; else queue.push(item);
}

const SaveQueue = {
    enqueueUpdate(checklistObj, checklistState) {
        const mabn = (checklistObj && (checklistObj.mabn || checklistObj.MABN || checklistObj.MaBN)) || '';
        const item = {
            id: `${mabn}:${Date.now()}`,
            mabn,
            type: 'updateChecklist',
            payload: { checklistObj, checklistState },
            createdAt: Date.now()
        };
        const q = loadQueue();
        upsertByMabn(q, item);
        saveQueue(q);
        return item.id;
    },
    async drain(processor) {
        // processor: async ({ checklistObj, checklistState }) => boolean
        const q = loadQueue();
        if (!q.length) return 0;
        let successCount = 0;
        const rest = [];
        for (const item of q) {
            try {
                const ok = await processor(item.payload);
                if (ok) successCount++; else rest.push(item);
            } catch (_) { rest.push(item); }
        }
        saveQueue(rest);
        return successCount;
    },
    size() { return loadQueue().length; },
    purge(mabn) {
        const q = loadQueue().filter(i => i.mabn !== mabn);
        saveQueue(q);
    }
};

module.exports = SaveQueue;
