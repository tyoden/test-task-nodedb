import { Storage, FileStorage } from "./storage";
import MessengerClient from './messenger/MessengerClient';
import RabbitClient from "./messenger/client/RabbitClient";
import StorageLoggerProxy from "./storage/StorageLoggerProxy";


export default class Application {

    /**
     * @private
     * @type {object}
     */
    config;

    /**
     * @private
     * @type {Storage}
     */
    storage;

    /**
     * @private
     * @type {MessengerClient}
     */
    messenger;

    constructor(config) {
        this.config = config;

        this.messenger = new MessengerClient(new RabbitClient(this.config.messenger.rabbitMQ));

        const storage = new FileStorage(this.config.storage);
        const logger = new StorageLoggerProxy(storage, this.config.storage.dir);
        this.storage = new Storage(logger);
    }

    async init() {
        const { INCOME_QUEUE, OUTCOME_QUEUE } = this.config.messenger.rabbitMQ.io;

        await this.storage.open();
        await this.messenger.open();

        await this.messenger.subscribe(INCOME_QUEUE, message =>
            this.storage.handleMessage(message, message => {
                this.messenger.publish(OUTCOME_QUEUE, message);
            }));
    }
}