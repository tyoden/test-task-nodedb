import crypto from 'crypto';
import FileStorageBlock from "./FileStorageBlock";
import FileStorageEntry from "./FileStorageEntry";

export default class FileStorageIndex {

    /**
     * Free places in data file
     *
     * @type {Set<FileStorageBlock>}
     */
    tombstones;

    /**
     * Dictionary where key is entry key hash string and value is entry set
     *
     * @type {Map<string, Set<FileStorageEntry>>}
     */
    entries;

    /**
     * Whole base data size
     *
     * @type {number}
     */
    dataSize;

    /**
     * Current snapshot name
     *
     * @type {string}
     */
    snapshot;

    /**
     *
     * @type {number}
     */
    transactionsSequence;

    /**
     * @param {Map<string, Set<FileStorageEntry>>=} entries
     * @param {Set<FileStorageBlock>=} tombstones
     * @param {number=} size
     * @param {number=} transactionsSequence
     * @param {string=} snapshot
     */
    constructor(entries, tombstones, size, transactionsSequence, snapshot) {
        this.tombstones = tombstones || new Set();
        this.entries = entries || new Map();
        this.dataSize = size || 0;
        this.transactionsSequence = 0;
        this.snapshot = snapshot || null;
    }

    /**
     * @param {FileStorageEntry} entry
     */
    writeEntry(entry) {
        // append to data file
        if (entry.position === this.dataSize) this.dataSize += entry.size;
        // insert in middle of data file
        else this.reduceTombstones(entry);

        // store to dictionary
        this.addEntryToMap(entry);
    }

    removeEntry(entry) {
        if (!this.entries.has(entry.keyHash)) return;
        this.expandTombstones(entry);
        // remove from dictionary
        this.entries.get(entry.keyHash).delete(entry);
    }

    getEntries(key) {
        const hash = this.getKeyHash(key);
        return this.entries.has(hash) ? [...this.entries.get(hash)] : [];
    }

    /**
     * @param {Buffer} key
     * @returns {string}
     */
    getKeyHash(key) {
        // todo optimize double key hash calculation (in FileStorage#set index.createEntry and in index.getEntries)
        //  put this in a separate key class
        const hash = crypto.createHash('sha1');
        hash.update(key);
        return hash.digest('base64');
    }

    /**
     * @param {number} size
     * @returns {number}
     */
    getFreePosition(size) {
        // filter tombs with size equal or more than requested
        /** @type {FileStorageBlock[]} */
        const fits = [];
        this.tombstones.forEach(tombstone => {
            if (tombstone.size >= size) fits.push(tombstone);
        });

        // no position index inside current data file (need to append)
        if (!fits.length) return this.dataSize;

        // return lesser by size tombstone position
        return fits.sort((a, b) => a.size - b.size)[0].position;
    }

    /**
     * @returns {string}
     */
    serialize() {
        return this.toJSON();
    }

    /**
     * @param {string} snapshot
     */
    setSnapshot(snapshot) {
        this.snapshot = snapshot;
    }

    /**
     * @param {Buffer} buffer
     * @returns {FileStorageIndex}
     */
    static deserialize(buffer) {
        return FileStorageIndex.fromObject(JSON.parse(buffer.toString('utf8')));
    }

    /**
     * @private
     * @param {FileStorageEntry} entry
     */
    expandTombstones(entry) {
        // find overlap range with other tombstones and remove them
        const entryBlock = new FileStorageBlock(entry.position, entry.size);
        let first = entryBlock;
        let last = entryBlock;
        for (const block of this.tombstones) {
            if (block.isNeighbor(entryBlock) || block.isOverlap(entryBlock)) {
                if (first.position > block.position) first = block;
                if (last.end < block.end) last = block;
                this.tombstones.delete(block);
            }
        }

        // store overlapped range in result tombstone store it in set
        const resultBlock = new FileStorageBlock(first.position, last.end - first.position);
        this.tombstones.add(resultBlock);
    }

    /**
     * @private
     * @param {FileStorageEntry} entry
     */
    reduceTombstones(entry) {
        for (let block of this.tombstones) {
            if (block.position !== entry.position) continue;
            // remove current tombstone
            this.tombstones.delete(block);

            // save the remaining free space as new tombstone
            if (block.size > entry.size)
                this.tombstones.add(new FileStorageBlock(
                    entry.block.end,
                    block.size - entry.size));
            break;
        }
    }

    /**
     * @private
     * @param {FileStorageEntry} entry
     */
    addEntryToMap(entry) {
        if (!this.entries.has(entry.keyHash)) this.entries.set(entry.keyHash, new Set());
        this.entries.get(entry.keyHash).add(entry);
    }

    /**
     * @private
     * @returns {string}
     */
    toJSON() {
        return JSON.stringify({
            tombstones: [...this.tombstones],
            entries: [...this.entries].map(([key, val]) => [key, [...val]]),
            dataSize: this.dataSize,
            transactionsSequence: this.transactionsSequence,
            snapshot: this.snapshot
        });
    }

    /**
     * @private
     * @param {Object} jsonObject
     */
    static fromObject(jsonObject) {
        const { dataSize, transactionsSequence, snapshot } = jsonObject;

        // restore tombstones from object
        const tombstones = new Set();
        if (Array.isArray(jsonObject.tombstones)) {
            jsonObject.tombstones.forEach(({position, size}) =>
                tombstones.add(new FileStorageBlock(position, size)));
        }

        // restore entries from object
        const entries = new Map();
        if (Array.isArray(jsonObject.entries))
            jsonObject.entries.forEach(([key, value]) => {
                if (!Array.isArray(value)) return;
                const collection = new Set();
                value.forEach(val =>
                    collection.add(new FileStorageEntry(new FileStorageBlock(val.block.position, val.block.size),
                        val.sizeKey, val.sizeValue, val.keyHash)));
                entries.set(key, collection);
            });

        return new FileStorageIndex(entries, tombstones, dataSize, transactionsSequence, snapshot);
    }
}