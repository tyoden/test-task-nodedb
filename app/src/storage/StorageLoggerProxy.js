import path from 'path';
import winston from "winston";

/**
 * @implements IStorage
 */
export default class StorageLoggerProxy {

    /**
     * @type {IStorage}
     */
    storage;

    /**
     * @type {string}
     */
    dir;

    logger;

    /**
     * @param {IStorage} subject
     * @param {string} dir
     */
    constructor(subject, dir) {
        this.storage = subject;
        this.dir = path.join(dir, 'logs');
        this.logger = this.createLogger();
    }

    async get(key) {
        try {
            const result = await this.storage.get(key);
            this.logger.info(`Get command. Key: ${key.toString()}`);
            return result;
        } catch (e) {
            this.logger.error(`Get command. Key: ${key.toString()} Error: ${e}`);
            throw e;
        }
    }

    async set(key, value) {
        try {
            const result = await this.storage.set(key, value);

            this.logger.info(`Set command. Key: ${key.toString()} Value: ${value.toString()}`);
            return result;
        } catch (e) {
            this.logger.error(`Set command. Key: ${key.toString()} Value: ${value.toString()} Error: ${e}`);
            throw e;
        }
    }

    async remove(key) {
        try {
            const result = await this.storage.remove(key);
            this.logger.info(`Remove command. Key: ${key.toString()}`);
            return result;
        } catch (e) {
            this.logger.error(`Remove command. Key: ${key.toString()} Error: ${e}`);
            throw e;
        }
    }

    async close() {
        try {
            const result = await this.storage.close();
            this.logger.info('Successfully closed');
            return result;
        } catch (e) {
            this.logger.error(`Close exception. Error: ${e}`);
            throw e;
        }
    }

    async open() {
        try {
            const result = await this.storage.open();
            this.logger.info('Successfully opened');
            return result;
        } catch (e) {
            this.logger.error(`Open exception. Error: ${e}`);
            throw e;
        }
    }

    async snapshot() {
        try {
            const result = await this.storage.snapshot();
            this.logger.info('Snapshot created');
            return result;
        } catch (e) {
            this.logger.error(`Snapshot creation error: ${e}`);
            throw e;
        }
    }

    createLogger() {
        const logger = winston.createLogger({
            level: 'info',
            format: winston.format.json(),
            defaultMeta: { service: 'storage' },
            transports: [
                new winston.transports.File({
                    filename: path.join(this.dir, 'error.log'),
                    level: 'error',
                    timestamp: true
                }),
                new winston.transports.File({
                    filename: path.join(this.dir, 'info.log'),
                    level: 'info',
                    timestamp: true
                })
            ]
        });

        if (process.env.NODE_ENV !== 'production') {
            logger.add(new winston.transports.Console({
                format: winston.format.simple(),
                timestamp: true
            }));
        }

        return logger;
    }
}