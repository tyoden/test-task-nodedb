import amqp from 'amqplib';
import MessageHandler from "../messageHandler";
import MessageParseError from "../MessageParseError";

// todo фича: возможноть конфигурации кластера
//      реализация: отправлять сообщения в обменник и распределять при помощи паттерна: kayHash % nodeCount
// todo исследование: разобраться можно ли получать/отправлять сообщения потоком

export default class RabbitClient {

    /** @private */
    config;

    /** @private */
    connection;

    /** @private */
    channel;

    /**
     * @private
     * @type {Set<string>}
     */
    producerQueues;

    /**
     * @private
     * @type {Set<string>}
     */
    consumerQueues;

    /**
     * @private
     * @type {Set<Object>}
     */
    consumerTags;

    /**
     * @private
     * @type {MessageHandler}
     */
    messageHandler;

    constructor(config) {
        this.config = {...RabbitClient.defaultOptions, ...config};
        this.consumerQueues = new Set();
        this.producerQueues = new Set();
        this.consumerTags = new Set();
        this.messageHandler = new MessageHandler();
    }

    async open() {
        const { url, ...options } = this.config;
        this.connection = await this.connectWhile(url, options);
        this.channel = await this.connection.createChannel();
    }

    /**
     * @param {string} queue
     * @param {Message} message
     * @returns {Promise<void>}
     */
    async publish(queue, message) {
        await this.assertQueue(this.producerQueues, queue);
        const buffer = message.buildResponseBuffer();
        await this.channel.sendToQueue(queue, buffer, { persistent : true });
    }

    /**
     *
     * @param {string} queue
     * @param {function(Message):Promise<void>} handler
     * @returns {Promise<void>}
     */
    async subscribe(queue, handler) {
        await this.assertQueue(this.consumerQueues, queue);
        const consumerTag = await this.channel.consume(queue, async msg => {

            /** @type {Message} */
            let message;

            try {
                message = this.messageHandler.parse(msg.content);
            } catch (e) {
                // if message parsing exception then throw it away
                await this.channel.reject(msg, false);
                throw e;
            }

            try {
                await handler(message);
                await this.channel.ack(msg);
            } catch (e) {
                // if handle message exception then reject message with require flag
                await this.channel.reject(msg, true);
                throw e;
            }
        });
        this.consumerTags.add(consumerTag);
        return consumerTag;
    }

    async unsubscribe(consumerTag) {
        if (!consumerTag) {
            const promises = [];
            for (const tag of this.consumerTags)
                promises.push(this.channel.cancel(tag));
            await Promise.all(promises);
            return;
        }

        if (!this.consumerTags.has(consumerTag)) return;
        await this.channel.cancel(consumerTag);
        this.consumerTags.delete(consumerTag);
    }

    async close() {
        await Promise.all([...this.consumerTags].map(consumerTag => this.unsubscribe(consumerTag)));
        await this.connection.close();
    }

    /**
     * @private
     */
    async assertQueue(collection, name) {
        if (collection.has(name)) return;
        await this.channel.assertQueue(name, { durable : true });
        collection.add(name);
    }

    /**
     * @private
     * @param {string} url
     * @param options
     * @param {number=} attempts
     * @returns {Promise}
     */
    async connectWhile(url, options, attempts = 60) {
        let connection;
        while (!connection && attempts > 0) {
            try { connection = await this.connect(url, options); } catch (e) { }
            attempts--;
        }
        return connection;
    }

    /**
     * @private
     * @param url
     * @param options
     */
    connect(url, options) {
        return new Promise((resolve, reject) => {
            setTimeout(() => amqp.connect(url, options).then(resolve).catch(reject), 1000);
        });
    }

    static defaultOptions = Object.freeze({
        url: Object.freeze("amqp://localhost")
    });

}