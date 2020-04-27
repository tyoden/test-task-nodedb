import FileStorageBlock from "./FileStorageBlock";
import FileStorageSnapshotTransaction from "./FileStorageSnapshotTransaction";


const uintSize = 6;
const nameSize = 255;
const snapshotInitSize = uintSize * 2 + nameSize * 2;

export default class FileStorageSnapshot {

    /**
     * @readonly
     * @type {string}
     */
    name;

    /**
     * @readonly
     * @type {Date}
     */
    creationDate;

    /**
     * @readonly
     * @type {FileStorageSnapshotTransaction[]}
     */
    storedBlocks;

    /**
     * Original database byte size
     *
     * @readonly
     * @type {number}
     */
    originalDataSize;

    /**
     * Snapshot file byte size
     *
     * @type {number}
     */
    size;

    /**
     * @readonly
     * @type {string|null}
     */
    prev;

    /**
     * @type {FileStorageBlock}
     */
    get sizeRange() {
        return new FileStorageBlock(0, this.originalDataSize);
    }

    /**
     * @param {string} name
     * @param {Date} date Creation date
     * @param {number} originalSize Original database size
     * @param {FileStorageSnapshotTransaction[]} storedBlocks
     * @param {string=} prev Previous snapshot
     * @param {number=} size Snapshot file size
     */
    constructor(name, date, originalSize, storedBlocks, prev, size) {
        this.name = name;
        this.creationDate = date;
        this.storedBlocks = storedBlocks || [];
        this.originalDataSize = originalSize;
        this.size = size || snapshotInitSize;
        this.prev = prev || null;
    }

    /**
     *
     * @param {FileStorageSnapshotTransaction} transaction
     */
    add(transaction) {
        this.storedBlocks.push(transaction);
        this.size += transaction.snapshotBlock.size;
    }

    /**
     * @param {Buffer} buffer
     * @returns {FileStorageSnapshot}
     */
    static deserialize(buffer) {
        const dataStart = snapshotInitSize;
        const transactionSize = FileStorageSnapshotTransaction.serializedSize;

        const date = new Date(buffer.readUIntBE(0, uintSize));
        const size = buffer.readUIntBE(uintSize, uintSize);
        const name = buffer.toString('utf8', uintSize * 2, uintSize * 2 + nameSize);
        const prev = buffer.toString('utf8', uintSize * 2 + nameSize, dataStart) || null;
        const transactions = [];

        const transactionCount = (buffer.length - dataStart) / transactionSize;
        for (let i = 0; i < transactionCount; i++) {
            const offset = dataStart + i * transactionSize;
            transactions.push(FileStorageSnapshotTransaction.deserialize(buffer, offset))
        }

        return new FileStorageSnapshot(name, date, size, transactions, prev, buffer.length);
    }

    /**
     * @returns {Buffer}
     */
    serialize() {
        const dataStart = snapshotInitSize;
        const transactionSize = FileStorageSnapshotTransaction.serializedSize;

        const buffer = Buffer.alloc(uintSize * 2 + nameSize * 2 + this.storedBlocks.length * transactionSize);

        buffer.writeUIntBE(+this.creationDate, 0, uintSize);
        buffer.writeUIntBE(this.originalDataSize, uintSize, uintSize);
        buffer.write(this.name, uintSize * 2, nameSize, 'utf8');
        buffer.write(this.prev || "", uintSize * 2 + nameSize, nameSize, 'utf8');
        for (let i = 0; i < this.storedBlocks.length; i++)
            this.storedBlocks[i].serialize(buffer, dataStart + i * transactionSize);

        return buffer;
    }

}