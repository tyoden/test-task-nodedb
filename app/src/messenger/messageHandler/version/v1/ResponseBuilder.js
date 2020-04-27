import Message from "../../../message";

const version = 1;
const responseType = 2;
const messageMethod = new Map([
    [Message.Method.Get, 1],
    [Message.Method.Set, 2],
    [Message.Method.Remove, 3]
]);

const responseStatus = new Map([
    [Message.Status.Ok, 1],
    [Message.Status.NotFound, 2],
    [Message.Status.Fail, 3]
]);

const ok = 1;

export default class ResponseBuilder {

    /**
     *
     * @param {Symbol} method Message.Method
     * @param {MessageResponse} response
     * @param {Buffer} id
     * @returns {Buffer}
     */
    buildResponse(method, response, id) {
        return this.getResponseBuilder(method)(id, response);
    }

    getResponseBuilder(method) {
        switch (method) {
            case Message.Method.Get:
                return this.buildGetResponse;
            case Message.Method.Set:
                return this.buildSetResponse;
            case Message.Method.Remove:
                return this.buildRemoveResponse;
            default:
                new Error("Not supported method")
        }
    }

    /**
     * @param {Buffer} requestId
     * @param {MessageResponse} messageResponse
     * @returns {Buffer}
     */
    buildGetResponse(requestId, messageResponse) {
        const meta = Buffer.alloc(6);

        this.setVersion(meta);
        this.setStatus(meta, messageResponse.status);
        this.setMethod(meta, Message.Method.Get);
        this.setRequestIdSize(meta, requestId);
        if (messageResponse.status !== Message.Status.Ok)
            return Buffer.concat([meta, requestId]);
        return Buffer.concat([meta, requestId, messageResponse.data]); // join meta, request id and data
    }

    /**
     * @param {Buffer} requestId
     * @param {MessageResponse} messageResponse
     * @returns {Buffer}
     */
    buildSetResponse(requestId, messageResponse) {
        const meta = Buffer.alloc(6);

        this.setVersion(meta);
        this.setStatus(meta, messageResponse.status);
        this.setMethod(meta, Message.Method.Set);
        this.setRequestIdSize(meta, requestId);

        return Buffer.concat([meta, requestId]); // join meta and request id
    }

    /**
     * @param {Buffer} requestId
     * @param {MessageResponse} messageResponse
     * @returns {Buffer}
     */
    buildRemoveResponse(requestId, messageResponse) {
        const meta = Buffer.alloc(6);

        this.setVersion(meta);
        this.setStatus(meta, messageResponse.status);
        this.setMethod(meta, Message.Method.Remove);
        this.setRequestIdSize(meta, requestId);

        // skip 0
        return Buffer.concat([meta, requestId]); // join meta and request id
    }

    setVersion(buffer) {
        buffer.writeUInt8(version, 1); // protocol version 1
    }

    setMethod(buffer, method) {
        buffer.writeUInt8(messageMethod.get(method), 2);
    }

    setStatus(buffer, status) {
        buffer.writeUInt8(responseStatus.get(status), 3);
    }

    setRequestIdSize(buffer, id) {
        buffer.writeUInt16BE(id.length, 4); // id byte size
    }
}