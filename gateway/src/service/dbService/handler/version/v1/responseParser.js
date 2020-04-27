import DbResponse from "../../../DbResponse";
const metaSize = 6;

const statusMap = new Map([
    [1, DbResponse.Status.Ok],
    [2, DbResponse.Status.NotFound],
    [3, DbResponse.Status.Fail],
]);

export default class ResponseParser {

    parse(buffer) {
        const method = this.readMethod(buffer);
        switch (method) {
            case 1:
                return this.get(buffer);
            case 2:
                return this.set(buffer);
            case 3:
                return this.remove(buffer);
            default:
                throw new Error("Not supported method");
        }
    }

    /**
     * @param {Buffer} buffer
     */
    get(buffer) {
        const status = this.readStatus(buffer);
        const id = this.readRequestId(buffer);
        const value = this.readValue(buffer);
        return new DbResponse(id, status, value);
    }

    /**
     * @param {Buffer} buffer
     */
    set(buffer) {
        const status = this.readStatus(buffer);
        const id = this.readRequestId(buffer);
        return new DbResponse(id, status);
    }

    /**
     * @param {Buffer} buffer
     */
    remove(buffer) {
        const status = this.readStatus(buffer);
        const id = this.readRequestId(buffer);
        return new DbResponse(id, status);
    }

    /**
     * @private
     * @param {Buffer} buffer
     * @returns {Symbol}
     */
    readStatus(buffer) {
        return statusMap.get(buffer.readUInt8(3));
    }

    /**
     * @private
     * @param {Buffer} buffer
     * @returns {string}
     */
    readRequestId(buffer) {
        const idSize = this.readIdSize(buffer);
        return buffer.toString('utf8', metaSize, metaSize + idSize);
    }

    /**
     * @private
     * @param {Buffer} buffer
     * @returns {Buffer}
     */
    readValue(buffer) {
        const idSize = this.readIdSize(buffer);
        const start = metaSize + idSize;
        const data = Buffer.alloc(buffer.length - start);
        buffer.copy(data, 0, start);
        return data;
    }

    /**
     * @private
     * @param {Buffer} buffer
     * @returns {number}
     */
    readIdSize(buffer) {
        return buffer.readUInt16BE(4);
    }

    /**
     * @private
     * @param {Buffer} buffer
     * @returns {number}
     */
    readMethod(buffer) {
        return buffer.readUInt8(2);
    }

}