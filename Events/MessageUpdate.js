import Event from "../Structures/event.js"

export default class MessageUpdateListener extends Event {
    constructor(client) {
        super(client, "messageUpdate")
    }

    async run(old_message, new_message) {
        if (new_message?.author?.bot) return
        if (old_message?.content == new_message?.content) return

        this.client.emit('messageCreate', new_message)
    }
}