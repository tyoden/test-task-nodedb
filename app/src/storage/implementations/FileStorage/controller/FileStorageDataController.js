import FileHelper from "../helper/FileHelper";

export default class FileStorageDataController {

    /**
     * @private
     * @type {string}
     */
    filePath;

    /**
     * @private
     * @type {FileHelper|null}
     */
    fileHandle;

    /**
     * @param {Object} options
     * @param {string} options.filePath
     */
    constructor(options) {
        if (!options.filePath) throw new Error("options.filePath argument not passed");
        this.filePath = options.filePath;
        this.fileHandle = null;
    }

    async init() {
        if (this.fileHandle) return;
        if (!(await FileHelper.existsFile(this.filePath))) await FileHelper.writeFile(this.filePath);
        this.fileHandle = await FileHelper.open(this.filePath);
    }

    async close() {
        if (!this.fileHandle) return;
        await this.fileHandle.close();
        this.fileHandle = null;
    }

    /**
     * @param {FileStorageEntry} entry
     * @param {Buffer} key
     * @param {Buffer} value
     * @returns {Promise<void>}
     */
    async writeData(entry, key, value) {
        const data = Buffer.concat([key, value]);
        return this.fileHandle.write(data, 0, data.length, entry.position);
    }

    /**
     * @param {FileStorageEntry} entry
     * @returns {Promise<Buffer>}
     */
    async getDataKey(entry) {
        return this.read(entry.position, entry.sizeKey);
    }

    /**
     * @param {FileStorageEntry} entry
     * @returns {Promise<Buffer>}
     */
    getDataValue(entry) {
        return this.read(entry.position + entry.sizeKey, entry.sizeValue);
    }

    /**
     * @param {FileStorageBlock} block
     * @returns {Promise<Buffer>}
     */
    async getDataBlock(block) {
        return this.read(block.position, block.size);
    }

    /**
     * @private
     * @param {number} position
     * @param {number} size
     * @returns {Promise<*>}
     */
    async read(position, size) {
        const buffer = Buffer.alloc(size);
        await this.fileHandle.read(buffer, 0, size, position);
        return buffer;
    }
}
