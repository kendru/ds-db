const { expect } = require('chai');
const sinon = require('sinon');
const Table = require('../lib/Table');
const SkipList = require('../lib/SkipList');

describe('Table', () => {
    let t;

    beforeEach(() => {
        t = new Table();
    });

    it('should have an initial size of 0', () => {
        expect(t.size).to.equal(0);
    });

    it('should increase the table size on insert', () => {
        t.insert({
            id: 123,
            name: 'Andrew',
            age: 29
        });
        expect(t.size).to.equal(1);
    });

    it('should lookup an inserted record by property', () => {
        const record = {
            id: 123,
            name: 'Andrew',
            age: 29
        };
        t.insert(record);

        expect(t.lookup('id', 0)).to.be.empty;
        expect(t.lookup('id', 123)).to.eql([record]);
    });

    describe('scans', () => {
        beforeEach(() => {
            t.insert({ id: 1 });
            t.insert({ id: 2 });
            t.insert({ id: 3 });
        });

        describe('closed range', () => {
            it('should return records within both table bounds', () => {
                expect(t.range('id', 1, 3)).to.eql([{ id: 1 }, { id: 2 }, { id: 3 }]);
            });

            it('should return records within only upper table bound', () => {
                expect(t.range('id', 0, 3)).to.eql([{ id: 1 }, { id: 2 }, { id: 3 }]);
            });

            it('should return records within only lower table bound', () => {
                expect(t.range('id', 1, 4)).to.eql([{ id: 1 }, { id: 2 }, { id: 3 }]);
            });

            it('should use an index if present', () => {
                const mockIndex = {
                    scan: sinon.stub().returns([1,2])
                };
                t.createIndex('id', mockIndex);

                expect(t.range('id', 50, 100)).to.eql([ t.records[1], t.records[2] ]);
                sinon.assert.calledWithExactly(mockIndex.scan, 50, 100);
            });
        })

        describe('half-open range', () => {
            it('should return records open on upper end', () => {
                expect(t.range('id', 2)).to.eql([{ id: 2 }, { id: 3 }]);
            });

            it('should return records open on lower end', () => {
                expect(t.range('id', null, 2)).to.eql([{ id: 1 }, { id: 2 }]);
            });

            it('should use an index if present', () => {
                const mockIndex = {
                    scan: sinon.stub().returns([1,2])
                };
                t.createIndex('id', mockIndex);

                expect(t.range('id', null, 100)).to.eql([ t.records[1], t.records[2] ]);
                sinon.assert.calledWithExactly(mockIndex.scan, null, 100);
            });
        });

        describe('full-open range', () => {
            it('should return all records with no bounds specified', () => {
                expect(t.range('id')).to.eql([{ id: 1 }, { id: 2 }, { id: 3 }]);
            });

            it('should not include records that do not contain the scanned attribute', () => {
                t.insert({ name: 'Fido' });
                t.insert({ id: 12, other: 'attr' });

                expect(t.range('id')).to.eql([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 12, other: 'attr' }]);
            });

            it('should use an index if present', () => {
                const mockIndex = {
                    scan: sinon.stub().returns([1,2])
                };
                t.createIndex('id', mockIndex);

                expect(t.range('id')).to.eql([ t.records[1], t.records[2] ]);
                sinon.assert.calledWithExactly(mockIndex.scan, null, null);
            });
        });
    })

    it('should update indexes on insert', () => {
        const mockIndex = {
            insert: sinon.stub()
        };
        t.createIndex('id', mockIndex);

        sinon.assert.notCalled(mockIndex.insert);
        t.insert({ id: 456 });
        sinon.assert.calledWithExactly(mockIndex.insert, 456, 0);
        t.insert({ id: 999 });
        sinon.assert.calledWithExactly(mockIndex.insert, 999, 1);
    });

    it('should use an index for lookup', () => {
        const mockIndex = {
            lookup: sinon.stub().returns(null)
        };
        t.createIndex('id', mockIndex);

        sinon.assert.notCalled(mockIndex.lookup);
        t.lookup('id', 123);
        sinon.assert.calledWithExactly(mockIndex.lookup, 123);
    });

    it('should integrate with the SkipList', () => {
        const t = new Table();
        t.createIndex('id', new SkipList());
        t.createIndex('name', new SkipList());
        t.createIndex('birthday', new SkipList());

        t.insert({ id: 1, name: 'Adam', birthday: '1989-10-28' });
        t.insert({ id: 2, name: 'Dianne', birthday: '1986-11-26' });
        t.insert({ id: 3, name: 'John', birthday: '2010-07-23' });
        t.insert({ id: 4, name: 'Aubrey', birthday: '2007-09-28' });
        t.insert({ id: 5, name: 'Abe', birthday: '2010-12-03' });
        t.insert({ id: 6, name: 'Adam', birthday: '1923-04-12' });

        expect(t.lookup('id', 2)[0].name).to.equal('Dianne');
        expect(t.lookup('name', 'Adam').map(r => r.id)).to.eql([1, 6]);
        expect(t.range('birthday', '2000').map(r => r.name)).to.eql(['Aubrey', 'John', 'Abe']);
    });
});