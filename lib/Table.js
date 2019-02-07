const TOMBSTONE = Symbol('tombstone');

class Table {
    constructor() {
        this.deletedCount = 0;
        this.records = [];
        this.indices = {}
        this._deleteRecordAtIndex = this._deleteRecordAtIndex.bind(this);
    }

    get size() {
        return this.records.length - this.deletedCount;
    }

    allRecords() {
        return this.records.filter(r => r !== TOMBSTONE);
    }

    insert(record) {
        const idx = this.size;
        this.records.push(record);
        this._updateIndexes(record, idx);
    }

    // TODO: Implement vacuum process to remove tombstones and rebuild indexes
    delete(prop, val) {
        const idx = this.indices[prop];
        if (idx) {
            const recordIndexes = idx.lookup(val);
            if (recordIndexes) {
                recordIndexes.forEach(this._deleteRecordAtIndex);
            }
            this.deletedCount += recordIndexes.length;
        } else {
            this.records.forEach((record, i) => {
                const attr = record[prop];
                if (typeof attr !== 'undefined' && attr === val) {
                    this._deleteRecordAtIndex(i);
                    this.deletedCount++;
                }
            })
        }
    }

    lookup(prop, val) {
        const idx = this.indices[prop];
        if (idx) {
            const ptrs = idx.lookup(val);
            return ptrs ? ptrs.map(ptr => this.records[ptr]) : [];
        }
        return this.records
            .filter(record => {
                const attr = record[prop];
                return typeof attr !== 'undefined' && attr === val;
            });
    }

    update(prop, val, updates) {
        const idx = this.indices[prop];
        if (idx) {
            const ptrs = idx.lookup(val);
            if (ptrs) {
                ptrs.forEach(i => this._updateRecord(i, updates));
            }
        }

        this.records
            .forEach((record, i) => {
                const attr = record[prop];
                if (typeof attr !== 'undefined' && attr === val) {
                    this._updateRecord(i, updates);
                }
            });
    }

    range(prop, min = null, max = null) {
        const idx = this.indices[prop];
        if (idx) {
            const ptrs = idx.scan(min, max);
            return ptrs.map(ptr => this.records[ptr]);
        }

        return this.records
            .filter(record => {
                const attr = record[prop];
                if (typeof attr === 'undefined') {
                    return false;
                }

                let ok = true;
                if (min !== null) {
                    ok = ok && attr >= min;
                }

                if (max !== null) {
                    ok = ok && attr <= max;
                }

                return ok;
            });
    }

    createIndex(prop, idx) {
        this.indices[prop] = idx;
        this.records.forEach((record, i) => {
            if (record === TOMBSTONE) {
                return;
            }

            if (record.hasOwnProperty(prop)) {
                idx.insert(record[prop], i);
            }
        });
    }

    _updateIndexes(record, idx) {
        Object.keys(this.indices).forEach(prop => {
            if (record.hasOwnProperty(prop)) {
                this.indices[prop].insert(record[prop], idx);
            }
        });
    }

    _deleteRecordAtIndex(i) {
        const record = this.records[i];
        this.records[i] = TOMBSTONE;
        Object.keys(this.indices).forEach(prop => {
            const idxKey = record[prop];
            if (typeof idxKey === 'undefined') {
                return;
            }
            this.indices[prop].delete(idxKey, i);
        });
    }

    _updateRecord(i, updates) {
        const record = this.records[i];
        Object.keys(updates).forEach(key => {
            const newVal = updates[key];
            const oldVal = record[key];

            if (newVal !== oldVal) {
                record[key] = newVal;

                const idx = this.indices[key];
                if (idx) {
                    idx.delete(oldVal, i);
                    idx.insert(newVal, i);
                }
            }
        });
    }
}

module.exports = Table;