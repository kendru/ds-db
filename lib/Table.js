class Table {
    constructor() {
        this.records = [];
        this.indices = {}
    }

    get size() {
        return this.records.length;
    }

    insert(record) {
        const idx = this.size;
        this.records.push(record);
        this._updateIndexes(record, idx);
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
}

module.exports = Table;