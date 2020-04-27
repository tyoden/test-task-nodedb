import GetCommand from "./command/GetCommand";
import SetCommand from "./command/SetCommand";
import RemoveCommand from "./command/RemoveCommand";
import Message from "../messenger/message";

const methodCommandConstructorMap = new Map([
    [Message.Method.Set, SetCommand],
    [Message.Method.Get, GetCommand],
    [Message.Method.Remove, RemoveCommand]
]);

export default class CommandBuilder {
    /**
     * @type {IStorage}
     */
    storage;

    constructor(storage) {
        this.storage = storage;
    }

    /**
     * @param {Message} message
     * @param {function(Message):void} callback
     * @returns {Command}
     */
    createCommand(message, callback) {
        const CommandConstructor = methodCommandConstructorMap.get(message.method);
        return new CommandConstructor(this.storage, message, callback);
    }
}