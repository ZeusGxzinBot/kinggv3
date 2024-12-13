import Command from "../../Structures/command.js"

import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"

export default class InviteCommand extends Command {
    constructor(client) {
        super(client, {
            name: "convite",
            description: "Obtenha os links de redirecionamento da aplicação!",
            aliases: ['convites', 'convidar', 'servidoroficial', 'botinvite', 'convitebot', 'invite']
        })
    }

    async run(message, args) {
        let row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setURL(this.client.config.links.invitation_url)
                    .setStyle(ButtonStyle.Link)
                    .setLabel('Me adicione'),
                new ButtonBuilder()
                    .setURL(this.client.config.links.official_guild)
                    .setStyle(ButtonStyle.Link)
                    .setLabel('Servidor oficial')
            )

        return message.reply({
            content: `🔗 ${message.author.toString()}, para me adicionar ao seu servidor ou ser redirecionado para meu servidor oficial, clique nos botões abaixo!`,
            components: [row]
        })
    }
}
