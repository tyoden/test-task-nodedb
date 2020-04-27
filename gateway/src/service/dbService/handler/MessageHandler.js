import versions from "./version";
import { nanoid } from "nanoid"
import DbRequest from "../DbRequest";

export default class MessageHandler {

    /**
     * @private
     * @type {{parser: ResponseParser, builder: RequestBuilder}}
     */
    handler;

    constructor(protocolVersion) {
        this.handler = getVersionHandler(protocolVersion);
    }

    /**
     * @param {string} key
     * @param {string} value
     * @returns {DbRequest}
     */
    buildSetRequest(key, value) {
        const id = generateId();
        return new DbRequest(id, this.handler.builder.set(Buffer.from(key), Buffer.from(value), Buffer.from(id)));
    }

    /**
     * @param {string} key
     * @returns {DbRequest}
     */
    buildGetRequest(key) {
        const id = generateId();
        return new DbRequest(id, this.handler.builder.get(Buffer.from(key), Buffer.from(id)));
    }

    /**
     * @param {string} key
     *  @returns {DbRequest}
     */
    buildRemoveRequest(key) {
        const id = generateId();
        return new DbRequest(id, this.handler.builder.remove(Buffer.from(key), Buffer.from(id)));
    }

    /**
     *
     * @param buffer
     * @returns {DbResponse}
     */
    parseResponse(buffer) {
        return this.handler.parser.parse(buffer);
    }
}


function generateId() {
    return nanoid(21);
}

/**
 * @param {number} version
 * @returns {{parser: ResponseParser, builder: RequestBuilder}}
 */
function getVersionHandler(version) {
    return versions.has(version) ? versions.get(version) : versions.last;
}
