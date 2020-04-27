import StorageProxy from "./StorageProxy";
import CommandBuilder from "./CommandBuilder";
import CommandQueueController from "./CommandQueueController";

/**
 * @implements {IStorage}
 */
export default class Storage {

    /**
     * @type {IStorage}
     */
    #storage;

    /**
     * @private
     * @type {CommandQueueController}
     */
    #commandQueue;

    /**
     * @private
     * @type {CommandBuilder}
     */
    #commandBuilder;

    /**
     * @param {IStorage} storage
     */
    constructor(storage) {
        this.#storage = new StorageProxy(storage);
        this.#commandBuilder = new CommandBuilder(this.#storage);
        this.#commandQueue = new CommandQueueController();
    }

    /**
     * @param {Buffer} key
     * @param {Buffer} value
     * @returns {Promise<void>}
     */
    async set(key, value) {
        return this.#storage.set(key, value);
    }

    /**
     * @param {Buffer} key
     * @returns {Promise<Buffer>}
     */
    async get(key) {
        return this.#storage.get(key);
    }

    /**
     * @param {Buffer} key
     * @returns {Promise<void>}
     */
    async remove(key) {
        return this.#storage.remove(key);
    }

    async open() {
        return this.#storage.open();
    }

    async close() {
        return this.#storage.close();
    }

    async snapshot() {
        return this.#storage.snapshot();
    }

    handleMessage(message, callback) {
        const command = this.#commandBuilder.createCommand(message, callback);
        this.#commandQueue.enqueue(command);
    }
}


/**
 * @interface IStorage
 */

/**
 * Write key-value entry in to database
 *
 * @function
 * @name IStorage#set
 * @param key
 * @param value
 * @returns {Promise<void>}
 */

/**
 * Get entry value by key from database
 *
 * @function
 * @name IStorage#get
 * @param key
 * @returns {Promise<Buffer|null>}
 */

/**
 * Remove key-value entry by key from database
 *
 * @function
 * @name IStorage#remove
 * @param key
 * @returns {Promise<void>}
 */

/**
 * Create new database snapshot
 *
 * @function
 * @name IStorage#snapshot
 * @returns {Promise<void>}
 */

/**
 * Open and initialize database
 *
 * @function
 * @name IStorage#open
 * @returns {Promise<void>}
 */

/**
 * Close database processes
 *
 * @function
 * @name IStorage#close
 * @returns {Promise<void>}
 */