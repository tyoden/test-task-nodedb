import path from 'path';
import mkdirp from 'mkdirp';
import FileStorageIndexController from "./controller/FileStorageIndexController";
import FileStorageDataController from "./controller/FileStorageDataController";
import FileStorageSnapshotController from "./controller/FileStorageSnapshotController";

/**
 * @implements IStorage
 */
export default class FileStorage {

    /**
     * Database index controller
     *
     * @private
     * @type {FileStorageIndexController}
     */
    index;

    /**
     * Database snapshot controller
     *
     * @private
     * @type {FileStorageSnapshotController}
     */
    shot;

    /**
     * Database data file controller
     *
     * @private
     * @type {FileStorageDataController}
     */
    data;

    /**
     * @private
     * @type {Object}
     */
    options;

    /**
     * @param {Object} options
     * @param {string} options.dir
     */
    constructor(options) {
        this.options = options;
        this.index = this.instantiateIndexController(options);
        this.data = this.instantiateDataController(options);
        this.shot = this.instantiateSnapshotController(options);
    }

    /**
     * @returns {Promise<void>}
     */
    async open() {
        await this.createDirs();
        await Promise.all([this.index, this.data].map(controller => controller.init()));
        await this.shot.init(this.index.snapshotName);
    }

    /**
     * @returns {Promise<void>}
     */
    async close() {
        await Promise.all([this.index, this.data, this.shot].map(controller => controller.close()));
    }

    /**
     * Get value by key
     *
     * @param {Buffer} key
     * @returns {Promise<Buffer|null>}
     */
    async get(key) {
        const entry = await this.findEntryByKey(key);
        if (entry) return this.getEntryValue(entry);
        return null;
    }

    /**
     * Set key-value entry
     * Rewrite value if key exists
     *
     * @param {Buffer} key
     * @param {Buffer} value
     * @returns {Promise<void>}
     */
    async set(key, value) {
        const entry = await this.findEntryByKey(key);
        if (entry) await this.removeEntry(entry);
        await this.writeEntry(key, value);
    }

    /**
     * Remove entry by key
     *
     * @param {Buffer} key
     * @returns {Promise<void>}
     */
    async remove(key) {
        const entry = await this.findEntryByKey(key);
        if (entry) await this.removeEntry(entry);
    }

    /**
     * Make new snapshot instance
     *
     * @returns {Promise<void>}
     */
    async snapshot() {
        this.index.setSnapshot(await this.shot.create(this.index.dataSize, this.index.serialize()));
    }

    /**
     * @private
     * @param {Buffer} key
     * @param {Buffer} value
     * @returns {Promise<void>}
     */
    async writeEntry(key, value) {
        const entry = this.index.createEntry(key, value);
        await this.storeBlockToSnapshot(entry.block);
        await Promise.all([
            this.index.write(entry),
            this.data.writeData(entry, key, value)
        ]);
    }

    /**
     * @private
     * @param {FileStorageEntry} entry
     */
    async removeEntry(entry) {
        await this.index.remove(entry);
    }

    /**
     * @private
     * @param {FileStorageEntry} entry
     * @returns {Promise<Buffer>}
     */
    getEntryValue(entry) {
        return this.data.getDataValue(entry);
    }

    /**
     * @private
     * @param {Buffer} key
     * @returns {Promise<null>}
     */
    async findEntryByKey(key) {
        //  get entries from index with same key hash
        const entries = this.index.getEntries(key);
        if (!entries || !entries.length)
            return null;

        // find entry with equal key
        for (const entry of entries)
            if (await this.compareKeyWithEntryKey(key, entry))
                return entry;

        return null;
    }

    /**
     * @private
     * @param {Buffer} key
     * @param {FileStorageEntry} entry
     * @returns {Promise<boolean>}
     */
    async compareKeyWithEntryKey(key, entry) {
        if (key.length !== entry.sizeKey) return false;
        return key.equals(await this.data.getDataKey(entry));
    }

    /**
     * @private
     * @param targetBlock
     * @returns {Promise<void>}
     */
    async storeBlockToSnapshot(targetBlock) {
        const blocks = this.shot.getNotStoredBlocksFor(targetBlock);
        for (const block of blocks)
            await this.shot.storeBlock(block, await this.data.getDataBlock(block));
    }

    /**
     * @private
     * @param {Object} options
     * @returns {FileStorageIndexController}
     */
    instantiateIndexController(options) {
        return new FileStorageIndexController({
            filePath: path.join(options.dir, 'db', 'index')
        });
    }

    /**
     * @param {Object} options
     * @returns {FileStorageDataController}
     */
    instantiateDataController(options) {
        return new FileStorageDataController({
            filePath: path.join(options.dir, 'db', 'data')
        });
    }

    /**
     * @private
     * @param {Object} options
     * @returns {FileStorageSnapshotController}
     */
    instantiateSnapshotController(options) {
        return new FileStorageSnapshotController({
            dir: path.join(options.dir, 'db')
        });
    }

    async createDirs() {
        await mkdirp(path.join(this.options.dir, 'db'));
    }
}