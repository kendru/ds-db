const { expect } = require('chai');
const SkipList = require('../lib/SkipList');

describe('Skip List', () => {
    let idx;

    beforeEach(() => {
        idx = new SkipList();
    });

    it('should insert and lookup an element', () => {
        idx.insert(5, 'five');
        expect(idx.lookup(5)).to.eql(['five']);
    });

    it('should return null when an element is not found', () => {
        expect(idx.lookup(42)).to.be.null;
    });

    it('should insert and lookup multiple elements', () => {
        idx.insert(5, 'five');
        idx.insert(6, 'six');
        idx.insert(4, 'four');

        expect(idx.lookup(4)).to.eql(['four']);
        expect(idx.lookup(5)).to.eql(['five']);
        expect(idx.lookup(6)).to.eql(['six']);
    });

    it('should collect multiple elements with a range scan', () => {
        idx.insert(1, 1);
        idx.insert(2, 2);
        idx.insert(4, 4);
        idx.insert(5, 5);
        idx.insert(7, 7);

        expect(idx.scan(2, 6)).to.eql([2, 4, 5]);
    });

    it('should collect a range when the min does not exist', () => {
        idx.insert(1, 1);
        idx.insert(3, 3);
        idx.insert(4, 4);

        expect(idx.scan(2, 4)).to.eql([3, 4]);
    });

    it('should allow a bottom-open range', () => {
        idx.insert(1, 1);
        idx.insert(2, 2);
        idx.insert(3, 3);

        expect(idx.scan(null, 2)).to.eql([1, 2]);
    });

    it('should allow a top-open range', () => {
        idx.insert(1, 1);
        idx.insert(2, 2);
        idx.insert(3, 3);

        expect(idx.scan(2, null)).to.eql([2, 3]);
    });

    it('should allow duplicates', () => {
        idx.insert(1, 'a');
        idx.insert(1, 'b');

        expect(idx.lookup(1)).to.eql(['a', 'b']);
    });

    it('should scan over duplicates', () => {
        idx.insert(1, 'a');
        idx.insert(1, 'b');
        idx.insert(2, 'c');
        idx.insert(2, 'd');

        expect(idx.scan(1, 2)).to.eql(['a', 'b', 'c', 'd']);
    });

    it('should order all elements', () => {
        const elems = [];
        for (let i = 0; i < 100; i++) {
            elems.push(Math.floor(Math.random() * 500000));
        }
        let sortedElems = [...elems].sort((a, b) => a < b ? -1 : 1);

        for (const e of elems) {
            idx.insert(e, e);
        }

        expect(idx.scan(-Infinity, Infinity)).to.eql(sortedElems);
    });
});