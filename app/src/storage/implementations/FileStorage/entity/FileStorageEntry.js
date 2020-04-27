import FileStorageBlock from "./FileStorageBlock";

export default class FileStorageEntry {
    /**
     * Position index in db file
     * @type {number}
     */
    get position() {
        return this.block.position;
    }

    /**
     * Byte size
     * @type {number}
     */
    get size() {
        return this.block.size;
    }

    /**
     * @type {FileStorageBlock}
     */
    block;

    /**
     * Key byte size
     * @type {number}
     */
    sizeKey;

    /**
     * Value byte size
     * @type {number}
     */
    sizeValue;

    /**
     * Key hash
     * @type {string}
     */
    keyHash;

    /**
     * todo key cache
     * Cache of entire key
     * Store it if key has small for fast checking
     *
     * @type {Buffer}
     */
    keyCache;

    constructor(block, sizeKey, sizeValue, keyHash) {
        this.block = block;
        this.sizeKey = sizeKey;
        this.sizeValue = sizeValue;
        this.keyHash = keyHash;
    }

    /**
     * @returns {Buffer}
     */
    serialize() {
        const sizes = Buffer.alloc(4);
        sizes.writeUInt16BE(this.sizeKey, 0);
        sizes.writeUInt16BE(this.sizeValue, 2);
        return Buffer.concat([sizes, Buffer.from(this.keyHash, 'base64'), this.block.serialize()]);
    }

    /**
     *
     * @param {Buffer} buffer
     * @param {number=} offset
     * @returns {FileStorageEntry}
     */
    static deserialize(buffer, offset = 0) {
        const sizeKey = buffer.readUInt16BE(offset);
        const sizeValue = buffer.readUInt16BE(offset + 2);
        const keyHash = buffer.toString('base64', offset + 4, offset + 24);
        const blockOffset = offset + this.serializedSize - FileStorageBlock.serializedSize;
        const block = FileStorageBlock.deserialize(buffer, blockOffset);
        return new FileStorageEntry(block, sizeKey, sizeValue, keyHash);
    }


    static serializedSize = FileStorageBlock.serializedSize + 24; // block + keySize + valueSize + keyHash
}