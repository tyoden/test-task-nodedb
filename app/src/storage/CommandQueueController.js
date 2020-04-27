import Queue from '../helpers/Queue';

export default class CommandQueueController {


    /**
     * @private
     * @type {Queue<function>}
     */
    queue;

    constructor() {
        this.queue = new Queue();
    }

    /**
     *
     * @param {Command} command
     */
    enqueue(command) {
        const empty = this.queue.isEmpty();
        this.enqueueCommand(command);
        if (empty) this.next();
    }

    /**
     * @private
     * @param command
     */
    enqueueCommand(command) {
        const handle = async () => {
            await command.execute();
            this.queue.dequeue();
        };
        this.queue.enqueue(handle);
    }

    /**
     * @private
     */
    next() {
        const handle = this.queue.peek();
        if (handle instanceof Function) handle();
    }
}