import FileStorageBlock from "./FileStorageBlock";

export default class FileStorageSnapshotTransaction {
    /**
     * Block inside original database file
     *
     * @type {FileStorageBlock}
     */
    block;

    /**
     * Block inside snapshot
     *
     * @type {FileStorageBlock}
     */
    snapshotBlock;

    /**
     * @param {FileStorageBlock} block
     * @param {FileStorageBlock} snapshotBlock
     */
    constructor(block, snapshotBlock) {
        this.block = block;
        this.snapshotBlock = snapshotBlock;
    }

    /**
     * @param {Buffer=} buffer
     * @param {number=} offset
     * @returns {Buffer}
     */
    serialize(buffer, offset = 0) {
        buffer = buffer || Buffer.allocate(FileStorageSnapshotTransaction.serializedSize);
        this.block.serialize(buffer, offset);
        this.snapshotBlock.serialize(buffer, offset + 12);
        return buffer;
    }

    static deserialize(buffer, offset = 0) {
        const block = FileStorageBlock.deserialize(buffer, offset);
        const snapshotBlock = FileStorageBlock.deserialize(buffer, offset + FileStorageBlock.serializedSize);
        return new FileStorageSnapshotTransaction(block, snapshotBlock)
    }

    static serializedSize = FileStorageBlock.serializedSize * 2;
}