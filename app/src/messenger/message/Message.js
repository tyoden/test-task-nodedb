import MessageResponse from "../MessageResponse";

export default class Message {
    /**
     * @readonly
     * @type {Symbol}
     */
    method;

    /**
     * @type {MessageResponse}
     */
    response;

    /**
     *
     * @param {Symbol} method
     * @param {Message~buildResponseCallback} responseBuilder
     */
    constructor(method, responseBuilder) {
        this.method = method;
        this.response = new MessageResponse(responseBuilder);
    }

    /**
     * @returns {Buffer}
     */
    buildResponseBuffer() {
        return this.response.buildBuffer();
    }

    /**
     *
     * @type {{Set: Symbol, Get: Symbol, Remove: Symbol}}
     */
    static Method = Object.freeze({
        Get: Symbol('get'),
        Set: Symbol('set'),
        Remove: Symbol('remove')
    });

    static get Status() {
        return MessageResponse.Status;
    }
}

/**
 * @callback Message~buildResponseCallback
 * @returns {Buffer}
 */