import { promises as fs, constants as fsConstants } from 'fs';

/**
 * Guarantees correct order of file operations
 */
// todo use state pattern
export default class FileHelper {

    /**
     * @private
     * @type {FileHandle}
     */
    handle;

    /**
     * @private
     * @type {Array}
     */
    queue;

    /**
     * @private
     * @type {boolean}
     */
    isClosing;

    /**
     * @private
     * @type {boolean}
     */
    isClosed;

    /**
     * @private
     */
    closePromise;

    /**
     * @private
     */
    closeResolve;

    /**
     * @private
     */
    closeReject;

    constructor(fileHandle) {
        this.handle = fileHandle;
        this.isClosing = false;
        this.queue = [];
        this.closePromise = new Promise((resolve, reject) => {
            this.closeResolve = resolve;
            this.closeReject = reject;
        });
    }

    /**
     * @returns {Promise<FileHelper>}
     */
    static async open(path, flag) {
        const handle = await fs.open(path, flag || 'r+');
        return new FileHelper(handle);
    }

    /**
     * @returns {Promise<void>}
     */
    write(...args) {
        return this.callMethod(this.handle.write, args);
    }

    /**
     * @returns {Promise<void>}
     */
    append(...args) {
        return this.callMethod(this.handle.appendFile, args);
    }

    /**
     * @returns {Promise<Buffer|string>}
     */
    read(...args) {
        return this.callMethod(this.handle.read, args);
    }

    /**
     * @returns {Promise<void>}
     */
    async close() {
        if (this.isClosing) return this.closePromise;
        this.isClosing = true;
        if (!this.queue.length) await this.handleClose();
    }

    /**
     * @private
     */
    enqueue(handle) {
        this.queue.push(handle);
        if (this.queue.length === 1) handle();
    }

    /**
     * @private
     */
    next() {
        this.queue.shift();
        if (this.queue.length) this.queue[0]();
        else if (this.isClosing) this.handleClose();
    }

    /**
     * @private
     */
    clear() {
        this.queue.length = 0;
        this.close();
    }

    /**
     * @private
     */
    callMethod(method, args) {
        return new Promise((resolve, reject) => {
            if (this.isClosed) {
                reject(new Error("File is closed"));
                return;
            }
            if (this.isClosing) {
                reject(new Error("File is closing"));
                return;
            }
            this.enqueue(async () => {
                try {
                    await method.apply(this.handle, args);
                    resolve();
                    this.next();
                } catch (e) {
                    reject(e);
                    this.clear();
                }
            })
        });
    }

    /**
     * @private
     */
    async handleClose() {
        try {
            await this.handle.close();
            this.closeResolve();
        } catch (e) {
            this.closeReject(e);
        } finally {
            this.isClosed = true;
        }
    }

    static writeFile(path, data) {
        return fs.writeFile(path, data || "");
    }

    static readFile(path) {
        return fs.readFile(path);
    }

    static async existsFile(path) {
        try {
            await fs.access(path, fsConstants.F_OK);
            return true;
        } catch (e) {
            return false;
        }
    }

}