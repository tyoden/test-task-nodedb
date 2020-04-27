import Command from "./Command";
import Message from "../../messenger/message";

export default class RemoveCommand extends Command  {

    async execute() {
        try {
            await this.storage.remove(this.message.key);
            this.message.response.status = Message.Status.Ok;
        } catch (e) {
            this.message.response.status = Message.Status.Fail;
            throw e; // todo check this error handle
        } finally {
            this.callback(this.message);
        }
    }
}
