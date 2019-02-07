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
    }

    _updateIndexes(record, idx) {
        Object.keys(this.indices).forEach(prop => {
            if (record.hasOwnProperty(prop)) {
                this.indices[prop].insert(record[prop], idx);
            }
        })
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
}

module.exports = Table;