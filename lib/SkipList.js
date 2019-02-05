const NIL = Symbol('nil');

class Node {

    constructor(key, value, next = NIL, down = NIL) {
        this.key = key;
        this.value = value;
        this.next = next;
        this.down = down;
    }

    walkDown() {
        if (this.down === NIL) {
            return this;
        }
        return this.down.walkDown();
    }

    toString() {
        return `${this.key}[${this.value}] -> ${this.next === NIL ? 'NIL' : this.next.toString()}`;
    }
}

class SkipList {

    constructor() {
        this.levels = [];
    }

    insert(key, value) {
        let node = this._lookupNodeLTE(key);
        if (node === NIL) {
            this._insertInLevel(0, key, value);
            return;
        }

        // Walk to bottom of tower
        node = node.walkDown();

        // If key already exists, append value
        if (node.key === key) {
            node.value.push(value);
            return;
        }

        // Insert into base list
        const prevNext = node.next;
        node.next = new Node(key, [value], prevNext, NIL);

        // Keep walking up to higher lists while the coin flip is true
        let lastNode = node.next;
        let level = 1;
        while (flipCoin()) {
            lastNode = this._insertInLevel(level++, key, null, lastNode);
        }
     }

     lookup(key) {
        const node = this._lookupNodeLTE(key);
        if (node === NIL || node.key !== key) {
            return null;
        }

        return node.walkDown().value;
    }

    scan(min = null, max = null) {
        let node = NIL;
        if (min !== null) {
            node = this._lookupNodeLTE(min);
        }

        if (node === NIL) {
            if (!this.levels[0]) {
                return [];
            }
            node = this.levels[0];
        }
        node = node.walkDown();
        if (node.key < min) {
            node = node.next;
        }

        if (node === NIL) {
            return [];
        }

        let out = [];
        do {
            if (max !== null && node.key > max) {
                break;
            }
            out = out.concat(node.value);
            node = node.next;
        } while (node !== NIL);

        return out;
    }

    _insertInLevel(idx, key, value, down = NIL) {
        const head = this.levels[idx];
        if (!head) {
            this.levels[idx] = new Node(key, [value], NIL, down);
            return this.levels[idx];
        }

        if (head.key > key) {
            this.levels[idx] = new Node(key, [value], head, down);
            return this.levels[idx];
        }

        let lastNode = head;
        do {
            let nextNode = lastNode.next;
            if (nextNode === NIL) {
                lastNode.next = new Node(key, value, NIL, down);
                return lastNode.next;
            }


            if (nextNode.key > key) {
                lastNode.next = new Node(key, value, nextNode, down);
                return lastNode.next;
            }
        } while (lastNode = lastNode.next);
    }

    _lookupNodeLTE(key) {
        let node = NIL;
        let lastNode = NIL;

        let level;
        for (level = this.levels.length - 1; level >= 0; level--) {
            lastNode = NIL;
            node = this.levels[level];

            while (node !== NIL) {
                if (key === node.key) {
                    return node;
                } else if (key < node.key) {
                    if (lastNode === NIL) {
                        // node is the first entry in this level - continue search at start of next level
                        break;
                    }
                    node = lastNode.down;
                    level--;
                    continue;
                }

                lastNode = node;
                node = node.next;
            }
        }

        return lastNode;
    }

    toString() {
        return this.levels
            .map(l => l.toString())
            .reverse()
            .join('\n');
    }
}

function flipCoin() {
    return Math.random() < 0.5;
}

module.exports = SkipList;