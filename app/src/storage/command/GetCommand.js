import Command from "./Command";
import Message from "../../messenger/message";

export default class GetCommand extends Command  {

    async execute() {
        try {
            const value = await this.storage.get(this.message.key);
            if (!(value instanceof Buffer)) {
                this.message.response.status = Message.Status.NotFound;
            } else {
                this.message.response.status = Message.Status.Ok;
                this.message.response.data = value;
            }
            this.callback(this.message);
        } catch (e) {
            this.message.response.status = Message.Status.Fail;
            throw e;
        }
    }
}