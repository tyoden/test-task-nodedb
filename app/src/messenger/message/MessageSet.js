import Message from "./Message";

export default class MessageSet extends Message {
    /**
     * @readonly
     * @type {Buffer}
     */
    key;

    /**
     * @readonly
     * @type {Buffer}
     */
    value;

    /**
     *
     * @param {Buffer} key
     * @param {Buffer} value
     * @param {function} responseBuilder
     */
    constructor(key, value, responseBuilder) {
        super(Message.Method.Set, responseBuilder);
        this.key = key;
        this.value = value;
    }
}