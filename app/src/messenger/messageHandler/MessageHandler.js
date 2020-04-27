import versions from "./version";

export default class MessageHandler {
    /**
     *
     * @param {Buffer} buffer
     * @returns {Message}
     */
    parse(buffer) {
        return this.buildMessage(buffer, this.getHandler(buffer));
    }

    /**
     * @private
     * @param {Buffer} buffer
     * @param {{parser: RequestParser, builder: ResponseBuilder}} handler
     * @returns {Message}
     */
    buildMessage(buffer, handler) {
        return handler.parser.buildMessage(buffer, handler.builder);
    }

    /**
     * @private
     * @param {Buffer} buffer
     * @returns {{parser: RequestParser, builder: ResponseBuilder}}
     */
    getHandler(buffer) {
        const version = this.getVersion(buffer);
        return versions.has(version) ? versions.get(version) : versions.last;
    }

    /**
     * @private
     * @param {Buffer} buffer
     * @returns {number}
     */
    getVersion(buffer) {
        return buffer.readUInt8(1);
    }
}