import FileStorageEntry from "./FileStorageEntry";

export default class FileStorageIndexTransaction {

    /**
     * Sequential id
     *
     * @type {number}
     */
    id;

    /**
     * Write/Remove
     *
     * @type {number}
     */
    type;

    /**
     * @type {FileStorageEntry}
     */
    entry;

    get isWrite() {
        return this.type === 1;
    }

    constructor(id, type, entry) {
        this.id = id;
        this.type = type;
        this.entry = entry;
    }

    /**
     * @returns {Buffer}
     */
    serialize() {
        const buffer = Buffer.alloc(5);
        buffer.writeUInt32BE(this.id, 0);
        buffer.writeUInt8(this.type, 4);
        return Buffer.concat([buffer, this.entry.serialize()]);
    }

    /**
     *
     * @param {Buffer} buffer
     * @param {number=} offset
     * @returns {FileStorageIndexTransaction}
     */
    static deserialize(buffer, offset = 0) {
        const id = buffer.readUInt32BE(offset);
        const type = buffer.readUInt8(offset + 4);
        const entry = FileStorageEntry.deserialize(buffer, offset + 5);
        return new FileStorageIndexTransaction(id, type, entry);
    }


    static serializedSize = FileStorageEntry.serializedSize + 5; // entry + id + type

}