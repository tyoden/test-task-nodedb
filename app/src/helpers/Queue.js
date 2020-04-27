/**
 * @index.ejs T
 */
export default class Queue extends Array {

    /**
     * @param {T} val
     */
    enqueue(val) {
        this.push(val);
    }

    /**
     * @returns {T}
     */
    dequeue() {
        return this.shift();
    }

    /**
     * @returns {T}
     */
    peek() {
        return this[0];
    }

    /**
     * @returns {boolean}
     */
    isEmpty() {
        return this.length === 0;
    }
}