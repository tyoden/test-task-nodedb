
export default class Command {

    /**
     * Currently processed message object
     *
     * @readonly
     * @type {Message}
     */
    message;

    /**
     * Link to a storage client
     *
     * @protected
     * @readonly
     * @type {IStorage}
     */
    storage;

    /**
     * After execute callback.
     * Callback is invoked anyway. And when the execution was successful, and when an error occurred.
     * All exceptions must be handled by the command.
     * The command must determine the response status and the response data before the callback.
     *
     * @protected
     * @type {function(Message):void}
     */
    callback;

    /**
     * @param {Storage} storage
     * @param {Message} message
     * @param {function(Message):void} callback
     */
    constructor(storage, message, callback) {
        this.storage = storage;
        this.message = message;
        this.callback = callback;
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async execute() {}
}