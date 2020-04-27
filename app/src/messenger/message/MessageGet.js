import Message from "./Message";


export default class MessageGet extends Message {
    /**
     * @readonly
     * @type {Buffer}
     */
    key;

    /**
     * @param {Buffer} key
     * @param {function} responseBuilder
     */
    constructor(key, responseBuilder) {
        super(Message.Method.Get, responseBuilder);
        this.key = key;
    }
}