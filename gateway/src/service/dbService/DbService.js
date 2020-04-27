import MessageHandler from "./handler/MessageHandler";
import DbConnector from "./DbConnector";
import DbResponse from "./DbResponse";

const timeout = 5000;



export default class DbService {

    constructor(options) {
        const { url, INCOME_QUEUE, OUTCOME_QUEUE } = options;

        this.map = new Map();
        this.messageHandler = new MessageHandler();
        this.connector = new DbConnector({
            url,
            INCOME_QUEUE,
            OUTCOME_QUEUE,
            incomeMessageHandler: buffer => this.handleIncomeMessage(buffer)
        });
    }

    async init() {
        await this.connector.init();
    }

    /**
     *
     * @param {string} key
     * @param {string} value
     * @returns {Promise<boolean>}
     */
    async set(key, value) {
        const setRequest = this.messageHandler.buildSetRequest(key, value);
        const response = await this.sendRequest(setRequest);
        if (response.status !== DbResponse.Status.Ok) throw new Error("Service internal error");
        return true;
    }

    /**
     * @param {string} key
     * @returns {Promise<string>}
     */
    async get (key) {
        const getRequest = this.messageHandler.buildGetRequest(key);
        const response = await this.sendRequest(getRequest);
        if (response.status === DbResponse.Status.NotFound) return null;
        if (response.status === DbResponse.Status.Ok) return response.data.toString();
        throw new Error("Service internal error");
    }

    /**
     * @param {string} key
     * @returns {Promise<boolean>}
     */
    async remove(key) {
        const removeRequest = this.messageHandler.buildRemoveRequest(key);
        const response = await this.sendRequest(removeRequest);
        if (response.status === DbResponse.Status.Fail) throw new Error("Service internal error");
        return true;
    }

    /**
     * @param {DbRequest} req
     * @returns {Promise<DbResponse>}
     */
    sendRequest(req) {
        const { resolve, reject, promise } = getInsideOutPromise();
        this.map.set(req.id, { resolve, reject });
        console.log('outcome id', req.id);
        this.connector.sendRequest(req.buffer);
        setTimeout(() => {
            this.map.delete(req.id);
            reject(new Error("Timeout"));
        }, timeout);
        return promise;
    }

    handleIncomeMessage(msg) {
        const res = this.messageHandler.parseResponse(msg);
        console.log('income id', res.id);
        if (!this.map.has(res.id)) return;
        const { resolve } = this.map.get(res.id);
        this.map.delete(res.id);
        resolve(res);
    }
}

function getInsideOutPromise() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return {
        promise,
        resolve,
        reject
    }
}
