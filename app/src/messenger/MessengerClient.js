export default class MessengerClient {

    messenger;

    constructor(messenger) {
        this.messenger = messenger;
    }

    async open() {
        return this.messenger.open();
    }

    /**
     * @param {string} to
     * @param {Message} message
     * @returns {Promise<*>}
     */
    async publish(to, message) {
        return this.messenger.publish(to, message);
    }

    /**
     *
     * @param {string} to
     * @param {function(Message)} handler
     * @returns {Promise<void>}
     */
    async subscribe(to, handler) {
        return this.messenger.subscribe(to, handler);
    }

    async unsubscribe(from) {
        return this.messenger.unsubscribe(from);
    }

    async close() {
        return this.messenger.close();
    }
}