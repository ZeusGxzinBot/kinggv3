import Event from "../Structures/event.js"

export default class InteractionCreateListener extends Event {
    constructor(client) {
        super(client, "interactionCreate")
    }

    async run(interaction) {
        let user = await this.client.psql.getUser(interaction.user.id)

        if (interaction.isCommand()) {
            return;
        } else {
            try {
                let int = await this.client.interactions.find(x => interaction.customId.startsWith(x.name.toLowerCase()))
                if (!int) return;

                int.execute(this.client, interaction)
            } catch (e) {
                console.log(e)
            }
        }
    }
}