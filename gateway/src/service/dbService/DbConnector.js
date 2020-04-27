import amqp from "amqplib"

export default class DbConnector {

    options;

    constructor(options) {
        this.options = options;
    }

    async init() {
        if (this.channel) return;
        const connection = await this.connectWhile(this.options.url);
        this.channel = await connection.createChannel();
        await Promise.all([
            this.channel.assertQueue(this.options.INCOME_QUEUE, { durable : true }),
            this.channel.assertQueue(this.options.OUTCOME_QUEUE, { durable : true })
        ]);
        this.channel.consume(this.options.INCOME_QUEUE, msg => {
            this.options.incomeMessageHandler(msg.content);
        }, { noAck: true });
    }

    /**
     * @param {Buffer} buffer
     */
    sendRequest(buffer) {
        this.channel.sendToQueue(this.options.OUTCOME_QUEUE, buffer, { persistent: true });
    }

    /**
     * @private
     * @param {string} url
     * @param {number=} attempts
     * @returns {Promise}
     */
    async connectWhile(url, attempts = 60) {
        let connection;
        while (!connection && attempts > 0) {
            try { connection = await this.connect(url); } catch (e) { }
            attempts--;
        }
        return connection;
    }

    /**
     * @private
     * @param url
     */
    connect(url) {
        return new Promise((resolve, reject) => {
            setTimeout(() => amqp.connect(url).then(resolve).catch(reject), 1000);
        });
    }
}