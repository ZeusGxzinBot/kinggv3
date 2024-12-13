import Command from "../../Structures/command.js"

import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js"

export default class VoteCommand extends Command {
    constructor(client) {
        super(client, {
            name: "votar",
            description: "Veja algumas informações sobre o plano VIP!",
            aliases: ['vote', 'voto', 'topgg', 'votes', 'votos']
        })
    }

    async run(message, args) {
        let user = await this.client.psql.getUser(message.author.id)

        let embed = new EmbedBuilder()

            .setColor(this.client.config.colors.default)
            .setTimestamp()
            .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })

            .setTitle("Vote para ganhar recompensas!")
            .setDescription("Sabia que votando em mim na plataforma [top.gg](https://top.gg/bot/816841271964467241) você tem direito a algumas recompensas?\nConfira abaixo as recompensas que você recebe atualmente por votar em mim, clique [AQUI](https://top.gg/bot/816841271964467241) para votar em mim!")
            .setThumbnail(this.client.user.displayAvatarURL())

            .setFields([
                {
                    name: "Votos",
                    value: `Você votou ${user.votes.toLocaleString()} vezes!!`,
                    inline: false
                },
                {
                    name: "Benefícios",
                    value: "- **45 minutos de VIP**\n- **50.000 moedas**\n- Insígnia temporária no perfil! (<:kingg_vote:1146877176432566442>)\n- Cargo no servidor oficial!",
                    inline: false
                }
            ])


        return message.reply({
            content: message.author.toString(),
            embeds: [embed]
        })
    }
}