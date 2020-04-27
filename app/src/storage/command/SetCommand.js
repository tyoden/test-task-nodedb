import Command from "./Command";
import Message from "../../messenger/message";

export default class SetCommand extends Command  {

    async execute() {
        try {
            await this.storage.set(this.message.key, this.message.value);
            this.message.response.status = Message.Status.Ok;
        } catch (e) {
            this.message.response.status = Message.Status.Fail;
            throw e; // todo check this error handle
        } finally {
            this.callback(this.message);
        }
    }
}
