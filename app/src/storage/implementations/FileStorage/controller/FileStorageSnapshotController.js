import path from 'path';
import FileHelper from "../helper/FileHelper";
import FileStorageSnapshotTransaction from "../entity/FileStorageSnapshotTransaction";
import FileStorageBlock from "../entity/FileStorageBlock";
import FileStorageSnapshot from "../entity/FileStorageSnapshot";

export default class FileStorageSnapshotController {

    /**
     * @private
     * @type {Object}
     */
    options;

    /**
     * @private
     * @type {FileStorageSnapshot|null}
     */
    currentSnapshot;

    /**
     * @private
     * @type {FileHelper}
     */
    transactionsFileHandle;

    /**
     * @private
     * @type {FileHelper}
     */
    dataFileHandle;


    /**
     * @param {Object} options
     * @param {string} options.dir Path to snapshots
     */
    constructor(options) {
        this.options = options;
        this.currentSnapshot = null;
        this.transactionsFileHandle = null;
        this.dataFileHandle = null;
    }


    /**
     * @param {string} snapshotName
     * @returns {Promise<void>}
     */
    async init(snapshotName) {
        if (!snapshotName) return;
        this.currentSnapshot = await this.loadSnapshot(snapshotName);
        await this.openCurrentSnapshotFileHandles();
    }

    /**
     * Create and replace current snapshot with new instance

     * @param {number} size
     * @param {string} serializedIndex
     *
     * @returns {Promise<string>}
     */
    async create(size, serializedIndex) {
        const date = new Date();
        const name = FileStorageSnapshotController.getSnapshotName(date);
        const prev = this.currentSnapshot ? this.currentSnapshot.name : null;
        const snapshot = new FileStorageSnapshot(name, date, size, [], prev);
        await this.closeCurrentSnapshotFileHandles();
        await this.createSnapshotFiles(snapshot, serializedIndex);
        this.currentSnapshot = snapshot;
        await this.openCurrentSnapshotFileHandles();
        return name;
    }

    /**
     * @param {FileStorageBlock} block
     * @returns {FileStorageBlock[]}
     */
    getNotStoredBlocksFor(block) {
        if (!this.currentSnapshot) return [];

        // remove a range that does not overlaps with snapshot range
        const overlapped = block.overlap(this.currentSnapshot.sizeRange);
        if (!overlapped) return [];

        // get not stored ranges in current snapshot from target range
        return [...this.getBlockDiff(overlapped)];
    }

    /**
     * @param {FileStorageBlock} block
     * @param {Buffer} data
     * @returns {Promise<void>}
     */
    async storeBlock(block, data) {
        if (!this.currentSnapshot) return;
        const newSnapshotBlock = new FileStorageBlock(this.currentSnapshot.size, block.size);
        const transaction = new FileStorageSnapshotTransaction(block, newSnapshotBlock);
        await Promise.all([
            this.writeTransactionToSnapshotFile(transaction),
            this.writeDataToSnapshotDataFile(data)
        ]);
        this.currentSnapshot.add(transaction);
    }

    async close() {
        await this.closeCurrentSnapshotFileHandles();
    }

    /**
     * @private
     * @param {string} snapshotName
     * @returns {FileStorageSnapshot}
     */
    async loadSnapshot(snapshotName) {
        const fileName = FileStorageSnapshotController.getSnapshotFileName(snapshotName);
        const filePath = path.resolve(this.options.dir, fileName);
        const buffer = await this.readFile(filePath);
        return FileStorageSnapshot.deserialize(buffer);
    }

    /**
     * @private
     * @param {FileStorageSnapshot} snapshot
     * @param {string} serializedIndex
     * @returns {Promise}
     */
    createSnapshotFiles(snapshot, serializedIndex) {
        return Promise.all([
            this.createFile(FileStorageSnapshotController.getIndexFileName(snapshot.name), serializedIndex),
            this.createFile(FileStorageSnapshotController.getSnapshotFileName(snapshot.name), snapshot.serialize()),
            this.createFile(FileStorageSnapshotController.getDataFileName(snapshot.name))
        ]);
    }

    /**
     * Return not stored ranges in current snapshot for target block
     *
     * @private
     * @param {FileStorageBlock} block Target block
     * @returns {Set<FileStorageBlock>}
     */
    getBlockDiff(block) {
        const resultBlocks = new Set();
        if (!this.currentSnapshot) return resultBlocks;

        resultBlocks.add(block);
        for (const { block: storedBlock } of this.currentSnapshot.storedBlocks) {
            let done = false;
            while (!done) {
                done = true;
                for (const resultBlock of resultBlocks) {
                    const diff = resultBlock.diff(storedBlock);
                    if (diff.length === 1 && diff[0].equals(resultBlock)) continue;
                    resultBlocks.delete(resultBlock);
                    diff.forEach(b => resultBlocks.add(b));
                    done = false;
                    break;
                }
            }
        }
        return resultBlocks;
    }

    /**
     * @private
     * @param path
     * @returns {Promise<Buffer>}
     */
    async readFile(path) {
        return FileHelper.readFile(path);
    }

    /**
     * @private
     * @param {FileStorageSnapshotTransaction} transaction
     * @returns {Promise<void>}
     */
    async writeTransactionToSnapshotFile(transaction) {
        if (!this.transactionsFileHandle) throw new Error("File not opened");
        await this.transactionsFileHandle.append(transaction.serialize());
    }

    /**
     * @private
     * @param {Buffer} data
     * @returns {Promise<void>}
     */
    async writeDataToSnapshotDataFile(data) {
        if (!this.dataFileHandle) throw new Error("File not opened");
        await this.dataFileHandle.append(data);
    }

    /**
     * @private
     * @param {string} name
     * @param {Buffer|string} data
     * @returns {Promise<void>}
     */
    async createFile(name, data = null) {
        const filePath = path.resolve(this.options.dir, name);
        await FileHelper.writeFile(filePath, data || "");
    }

    /**
     * @private
     * @returns {Promise<void>}
     */
    async openCurrentSnapshotFileHandles() {
        if (!this.currentSnapshot) return;
        if (this.transactionsFileHandle || this.dataFileHandle) return;

        const transactionFilePath = path.resolve(this.options.dir,
            FileStorageSnapshotController.getSnapshotFileName(this.currentSnapshot.name));

        const dataFilePath = path.resolve(this.options.dir,
            FileStorageSnapshotController.getDataFileName(this.currentSnapshot.name));

        const [transactionsFileHandle, dataFileHandle] = await Promise.all([
            FileHelper.open(transactionFilePath),
            FileHelper.open(dataFilePath)
        ]);

        this.transactionsFileHandle = transactionsFileHandle;
        this.dataFileHandle = dataFileHandle;
    }

    /**
     * @private
     * @returns {Promise<void>}
     */
    async closeCurrentSnapshotFileHandles() {
        if (!this.currentSnapshot) return;
        if (!this.transactionsFileHandle || !this.dataFileHandle) return;

        await Promise.all([
            this.transactionsFileHandle.close(),
            this.dataFileHandle.close()
        ]);

        this.transactionsFileHandle = null;
        this.dataFileHandle = null;
    }

    /**
     * @private
     * @param {Date} date
     * @returns {string}
     */
    static getSnapshotName(date) {
        return `snapshot_${+date}`;
    }

    /**
     * @private
     * @param {string} snapshotName
     * @returns {string}
     */
    static getSnapshotFileName(snapshotName) {
        return `${snapshotName}_snapshot`;
    }

    /**
     * @private
     * @param {string} snapshotName
     * @returns {string}
     */
    static getIndexFileName(snapshotName) {
        return `${snapshotName}_index`;
    }

    /**
     * @private
     * @param {string} snapshotName
     * @returns {string}
     */
    static getDataFileName(snapshotName) {
        return `${snapshotName}_data`;
    }
}