const version = 1;

const methodGet = 1;
const methodSet = 2;
const methodRemove = 3;

export default class RequestBuilder {

    /**
     * @param {Buffer} key
     * @param {Buffer} reqId
     * @returns {Buffer}
     */
    get(key, reqId) {
        return Buffer.concat([this.buildMetaBuffer(methodGet, reqId, key), reqId, key]);
    }

    /**
     * @param {Buffer} key
     * @param {Buffer} value
     * @param {Buffer} reqId
     * @returns {Buffer}
     */
    set(key, value, reqId) {
        return Buffer.concat([this.buildMetaBuffer(methodSet, reqId, key), reqId, key, value]);
    }

    /**
     * @param {Buffer} key
     * @param {Buffer} reqId
     * @returns {Buffer}
     */
    remove(key, reqId) {
        return Buffer.concat([this.buildMetaBuffer(methodRemove, reqId, key), reqId, key]);
    }


    /**
     * @private
     * @param {number}  method
     * @param {Buffer}  reqId
     * @param {Buffer}  key
     * @returns {Buffer}
     */
    buildMetaBuffer(method, reqId, key) {
        const meta = Buffer.alloc(7);

        this.setVersion(meta);
        this.setMethod(meta, method);
        this.setRequestIdSize(meta, reqId);
        this.setKeySize(meta, key);

        return meta;
    }

    /**
     * @private
     * @param {Buffer} buffer
     */
    setVersion(buffer) {
        buffer.writeUInt8(version, 1);
    }

    /**
     *
     * @param {Buffer} buffer
     * @param {number} method
     */
    setMethod(buffer, method) {
        buffer.writeUInt8(method, 2)
    }

    /**
     *
     * @param {Buffer} buffer
     * @param string
     */
    setRequestIdSize(buffer, string) {
        buffer.writeUInt16BE(Buffer.byteLength(string, 'utf8'), 3);
    }

    /**
     *
     * @param {Buffer} buffer
     * @param {Buffer} key
     */
    setKeySize(buffer, key) {
        buffer.writeUInt16BE(key.length, 5);
    }

}