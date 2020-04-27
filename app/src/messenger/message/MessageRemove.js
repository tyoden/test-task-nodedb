import Message from "./Message";

export default class MessageRemove extends Message {
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
        super(Message.Method.Remove, responseBuilder);
        this.key = key;
    }
}