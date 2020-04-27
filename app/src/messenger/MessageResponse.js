export default class MessageResponse {

    /**
     * @type {Symbol}
     */
    status;

    /**
     * @type {Buffer}
     */
    data;

    /**
     * @readonly
     * @type {function():Buffer}
     */
    buildBuffer;

    constructor(responseBuilder) {
        this.buildBuffer = responseBuilder;
    }

    /**
     *
     * @type {{Ok: Symbol, Fail: Symbol, NotFound: Symbol}}
     */
    static Status = Object.freeze({
        Ok: Symbol('ok'),
        Fail: Symbol('fail'),
        NotFound: Symbol('not found')
    });

}