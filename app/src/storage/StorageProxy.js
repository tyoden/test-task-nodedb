/**
 * Proxy that guarantees the existence of storage interface methods
 * For third-party storage implementations
 *
 * @implements IStorage
 */
export default class StorageProxy {

    /**
     * @type {IStorage}
     */
    #storage;

    /**
     * @param {IStorage} storage
     */
    constructor(storage) {
        this.#storage = storage;
    }

    /**
     * @param {string} key
     * @param value
     * @returns {Promise<void>}
     */
    async set(key, value) {
        if (this.#storage.set instanceof Function) return this.#storage.set(key, value);
        throw new Error('remove() must be implemented');
    }

    /**
     * @param {string} key
     * @param value
     * @returns {Promise<void>}
     */
    async insert(key, value) {
        if (this.#storage.insert instanceof Function) return this.#storage.insert(key, value);
        throw new Error('insert() must be implemented');
    }

    /**
     * @param {string} key
     * @returns {Promise<string>}
     */
    async get(key) {
        if (this.#storage.get instanceof Function) return this.#storage.get(key);
        throw new Error('get() must be implemented');
    }

    /**
     * @param {string} key
     * @returns {Promise<void>}
     */
    async remove(key) {
        if (this.#storage.remove instanceof Function) return this.#storage.remove(key);
        throw new Error('remove() must be implemented');
    }

    async open() {
        if (this.#storage.open instanceof Function) return this.#storage.open();
        throw new Error('open() must be implemented');
    }

    async close() {
        if (this.#storage.close instanceof Function) return this.#storage.close();
        throw new Error('close() must be implemented');
    }

    snapshot() {
        if (this.#storage.snapshot instanceof Function) return this.#storage.snapshot();
        throw new Error('snapshot() must be implemented');
    }
}