export default class FileStorageBlock {

    /**
     * Start position index in bytes
     *
     * @type {number}
     */
    position;

    /**
     * Size in bytes
     *
     * @type {number}
     */
    size;

    /**
     * Position + size
     *
     * @returns {number}
     */
    get end() {
        return this.position + this.size;
    }

    /**
     * @param {number} position
     * @param {number} size
     */
    constructor(position, size) {
        this.position = position;
        this.size = size;
    }

    /**
     * @param {number} position
     * @returns {boolean}
     */
    isWithin(position) {
        return this.position >= position && position < this.end;
    }

    /**
     * @param {FileStorageBlock} other
     * @returns {boolean}
     */
    isOverlap(other) {
        return this.position <= other.end && this.end >= other.position;
    }

    /**
     * @param {FileStorageBlock} other
     * @returns {boolean}
     */
    isNeighbor(other) {
        return this.position === other.end || other.position === this.end;
    }

    /**
     * @param {FileStorageBlock} other
     * @returns {FileStorageBlock|null}
     */
    overlap(other) {
        const start = Math.max(this.position, other.position);
        const end = Math.min(this.end, other.end);
        if (end - start > 0) return new FileStorageBlock(start, end - start);
        return null;
    }

    /**
     * @param {FileStorageBlock} other
     * @returns {FileStorageBlock[]}
     */
    subtract(other) {
        const overlap = this.overlap(other);
        return overlap === null ? [] : this.diff(overlap);
    }

    /**
     * @param {FileStorageBlock} other
     * @returns {FileStorageBlock[]}
     */
    diff(other) {
        const s1 = this.position;
        const e1 = this.end;
        const s2 = other.position;
        const e2 = other.end;
        const endpoints = [s1, s2, e1, e2].sort((a,b) => a - b);
        const result = [];

        if (endpoints[0] === s1 && endpoints[1] - endpoints[0] > 0)
            result.push(new FileStorageBlock(endpoints[0], endpoints[1] - endpoints[0]));

        if (endpoints[3] === e1 && endpoints[3] - endpoints[2] > 0)
            result.push(new FileStorageBlock(endpoints[2], endpoints[3] - endpoints[2]));

        return result;
    }

    /**
     * @param {FileStorageBlock} other
     * @returns {boolean}
     */
    equals(other) {
        return this.position === other.position && this.size === other.size;
    }

    serialize(buffer, offset = 0) {
        const uintSize = 6;
        buffer = buffer || Buffer.alloc(FileStorageBlock.serializedSize);
        buffer.writeUIntBE(this.position, offset, uintSize);
        buffer.writeUIntBE(this.size, offset + uintSize, uintSize);
        return buffer;
    }

    static deserialize(buffer, offset = 0) {
        const uintSize = 6;
        const position = buffer.readUIntBE(offset, uintSize);
        const size = buffer.readUIntBE(offset + uintSize, uintSize);
        return new FileStorageBlock(position, size);
    }

    static serializedSize = 12; // buffer UInt x 2
}