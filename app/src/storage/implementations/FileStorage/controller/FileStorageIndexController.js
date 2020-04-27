import FileStorageIndex from "../entity/FileStorageIndex";
import FileStorageEntry from "../entity/FileStorageEntry";
import FileStorageBlock from "../entity/FileStorageBlock";
import FileStorageIndexTransaction from "../entity/FileStorageIndexTransaction";
import FileHelper from "../helper/FileHelper";

export default class FileStorageIndexController {

    /**
     * @private
     * @type {FileStorageIndex}
     */
    index;

    /**
     * @private
     * @type {string}
     */
    filePath;

    /**
     * @private
     * @type {FileHelper}
     */
    indexTransactionFileHandle;

    /**
     * @returns {number}
     */
    get dataSize() {
        return this.index ? this.index.dataSize : 0;
    }

    /**
     * @returns {string}
     */
    get snapshotName() {
        return this.index.snapshot;
    }

    /**
     * @param {Object} options
     * @param {string} options.filePath
     */
    constructor(options) {
        if (!options.filePath) throw new Error("options.filePath argument not passed");
        this.filePath = options.filePath;
    }

    async init() {
        const indexExists = await FileHelper.existsFile(this.filePath);
        console.log(`Index is exists ${indexExists}`);
        if (!indexExists) {
            this.index = new FileStorageIndex();
            await this.writeIndexFile();
        } else {
            this.index = FileStorageIndex.deserialize(await FileHelper.readFile(this.filePath));
            await this.applyStoredTransactions();
        }
        await this.openFileHandles();
    }

    async close() {
        await this.closeFileHandles();
        await this.writeIndexFile();
    }

    /**
     * @param {FileStorageEntry} entry
     */
    async write(entry) {
        this.index.writeEntry(entry);
        await this.storeTransaction(entry, true);
    }

    /**
     * Mark space as free to write
     *
     * @param {FileStorageEntry} entry
     */
    async remove(entry) {
        this.index.removeEntry(entry);
        await this.storeTransaction(entry, false);
    }

    getEntries(key) {
        return this.index.getEntries(key);
    }

    /**
     * @returns {string}
     */
    serialize() {
        return this.index.serialize();
    }

    /**
     *
     * @param {Buffer} key
     * @param {Buffer} value
     * @returns {FileStorageEntry}
     */
    createEntry(key, value) {
        const size = key.length + value.length;
        const position = this.index.getFreePosition(size);
        const keyHash = this.index.getKeyHash(key);
        const block = new FileStorageBlock(position, size);
        return new FileStorageEntry(block, key.length, value.length, keyHash);
    }

    /**
     * @param {string} snapshot Snapshot name
     */
    setSnapshot(snapshot) {
        this.index.setSnapshot(snapshot);
    }

    /**
     * @private
     * @returns {Promise<void>}
     */
    async writeIndexFile() {
        const data = this.index.serialize();
        const fileOpened = !!this.indexTransactionFileHandle;
        if (fileOpened) await this.closeFileHandles();
        await Promise.all([
            FileHelper.writeFile(this.filePath, data),
            FileHelper.writeFile(`${this.filePath}_transactions`)
        ]);
        if (fileOpened) await this.openFileHandles();
    }

    /**
     * @private
     * @returns {Promise<FileStorageIndexTransaction[]>}
     */
    async readIndexTransactionsFile() {
        const buffer = await FileHelper.readFile(`${this.filePath}_transactions`);
        const size = Math.floor(buffer.length / FileStorageIndexTransaction.serializedSize);
        const transactions = [];
        for (let i = 0; i < size; i++) {
            const offset = FileStorageIndexTransaction.serializedSize * i;
            transactions.push(FileStorageIndexTransaction.deserialize(buffer, offset))
        }
        return transactions;
    }

    /**
     * @private
     * @returns {Promise<void>}
     */
    async applyStoredTransactions() {
        const transactions = await this.readIndexTransactionsFile();
        const filtered = transactions.filter(tr => tr.id > this.index.transactionsSequence);
        for (const transaction of filtered) {
            if (transaction.isWrite) this.index.writeEntry(transaction.entry);
            else this.index.removeEntry(transaction.entry);
        }
        if (transactions.length)
            this.index.transactionsSequence = transactions[transactions.length - 1].id;
    }

    /**
     * @private
     * @param entry
     * @param write
     * @returns {Promise<void>}
     */
    async storeTransaction(entry, write = true) {
        if (!this.indexTransactionFileHandle) throw new Error("File not opened");

        this.index.transactionsSequence += 1;
        const tr = new FileStorageIndexTransaction(this.index.transactionsSequence, write ? 1 : 0, entry);
        await this.indexTransactionFileHandle.append(tr.serialize());

        // store index on every 100 transactions and clean transactions file
        if (this.index.transactionsSequence % 100 === 0) await this.writeIndexFile();
    }

    /**
     * @private
     * @returns {Promise<void>}
     */
    async openFileHandles() {
        if (this.indexTransactionFileHandle) return;
        const transactionFilePath = `${this.filePath}_transactions`;
        this.indexTransactionFileHandle = await FileHelper.open(transactionFilePath);
    }

    /**
     * @private
     * @returns {Promise<void>}
     */
    async closeFileHandles() {
        if (!this.indexTransactionFileHandle) return;
        await this.indexTransactionFileHandle.close();
        this.indexTransactionFileHandle = null;
    }

}