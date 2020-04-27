import Message, { MessageGet, MessageSet, MessageRemove } from "../../../message";

const version = 1;
const responseType = 2;
const messageMethod = new Map([
    [1, Message.Method.Get],
    [2, Message.Method.Set],
    [3, Message.Method.Remove]
]);

export default class RequestParser {

    /**
     * @param {Buffer} buffer
     * @param {ResponseBuilder} responseBuilder
     * @returns {Message}
     */
    buildMessage(buffer, responseBuilder) {
        // skip 0
        // skip version
        const method = messageMethod.get(buffer.readUInt8(2)); // set/get/remove
        const parser = this.getMessageParser(method);
        return parser(buffer, responseBuilder);
    }

    /**
     * @param {Symbol} method
     * @returns {function}
     */
    getMessageParser(method) {
        switch (method) {
            case Message.Method.Get:
                return (...args) => this.getRequestParser(...args);
            case Message.Method.Set:
                return (...args) => this.setRequestParser(...args);
            case Message.Method.Remove:
                return (...args) => this.removeRequestParser(...args);
            default:
                new Error("Not supported method")
        }
    }

    /**
     * @param {Buffer} buffer
     * @param {ResponseBuilder} responseBuilder
     * @returns {Message}
     */
    getRequestParser(buffer, responseBuilder) {
        const [requestIdSize, keySize, dataStartIndex] = this.getMeta(buffer);
        const id = this.getId(buffer, dataStartIndex, requestIdSize);
        const key = this.getKey(buffer, dataStartIndex, requestIdSize, keySize);
        return new MessageGet(key, function() {
            return responseBuilder.buildGetResponse(id, this); // where this is MessageResponse
        });
    }

    /**
     * @param {Buffer} buffer
     * @param {ResponseBuilder} responseBuilder
     * @returns {Message}
     */
    setRequestParser(buffer, responseBuilder) {
        const [requestIdSize, keySize, dataStartIndex] = this.getMeta(buffer);
        const id = this.getId(buffer, dataStartIndex, requestIdSize);
        const key = this.getKey(buffer, dataStartIndex, requestIdSize, keySize);
        const value = Buffer.alloc(buffer.length - (dataStartIndex + id.length + key.length));
        buffer.copy(value, 0, dataStartIndex + requestIdSize + keySize);
        return new MessageSet(key, value, function() {
            return responseBuilder.buildSetResponse(id, this); // where this is MessageResponse
        });
    }

    /**
     * @param {Buffer} buffer
     * @param {ResponseBuilder} responseBuilder
     * @returns {Message}
     */
    removeRequestParser(buffer, responseBuilder) {
        const [requestIdSize, keySize, dataStartIndex] = this.getMeta(buffer);
        const id = this.getId(buffer, dataStartIndex, requestIdSize);
        const key = this.getKey(buffer, dataStartIndex, requestIdSize, keySize);
        return new MessageRemove(key, function() {
            return responseBuilder.buildRemoveResponse(id, this); // where this is MessageResponse
        });
    }

    getMeta(buffer) {
        return [
            this.getRequestIdSize(buffer),
            this.getKeySize(buffer),
            7 // data start index
        ];
    }

    getRequestIdSize(buffer) {
        return buffer.readUInt16BE(3);
    }

    getKeySize(buffer) {
        return buffer.readUInt16BE(5);
    }

    getId(buffer, dataStartIndex, requestIdSize) {
        const id = Buffer.alloc(requestIdSize);
        buffer.copy(id, 0, dataStartIndex, dataStartIndex + requestIdSize);
        return id;
    }

    getKey(buffer, dataStartIndex, requestIdSize, keySize) {
        const key = Buffer.alloc(keySize);
        buffer.copy(key,
            0,
            dataStartIndex + requestIdSize,
            dataStartIndex + requestIdSize + keySize);
        return key;
    }
}