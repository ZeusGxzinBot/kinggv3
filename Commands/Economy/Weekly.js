import Command from "../../Structures/command.js"
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"

import moment from "moment"

export default class DailyCommand extends Command {
    constructor(client) {
        super(client, {
            name: "semanal",
            description: "Colete sua recompensa diária!",
            aliases: ['weekly', 'weeklyprize', 'weeklyreward', 'recompensasemanal']
        })
    }

    async run(message, args) {
        let cds = await this.client.psql.getCooldowns(message.author.id, true)
        let data = await this.client.psql.getUser(message.author.id)

        let amount = this.client.utils.genNumber(60_000, 120_000)
        let next = new Date(moment().endOf('week') + 1).getTime()
        let premium = await this.client.psql.getUserPremium(message.author.id)

        if (Number(cds.weekly) > Date.now()) return message.reply({
            content: `⏰ ${message.author.toString()}, espere \`${await this.client.utils.formatTime(Number(cds.weekly), 2)}\` para poder utilizar esse comando novamente!`
        })

        let embed = new EmbedBuilder()

            .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })
            .setColor(this.client.config.colors.default)
            .setTimestamp()

            .setTitle('Recompensa semanal')
            .setDescription(`${message.author.toString()}, parabéns, você coletou sua recompensa semanal! Nela você ganhou **🪙 ${amount.toLocaleString()} moedas**! ${premium ? `\`(+${amount.toLocaleString()} bônus)\`` : ``}`)

            .setFields([
                {
                    name: 'Próxima reocmpensa',
                    value: `${moment(next).format('LLLL')}`,
                    inline: true
                }
            ])

        let row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Lembrar-me')
                    .setCustomId(`remind_${message.author.id}_${next}_weekly`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔔')
                    .setDisabled(false)
            )

        await this.client.psql.updateCooldowns(message.author.id, 'weekly', next)
        await this.client.psql.updateUserMoney(message.author.id, premium ? amount * 2 : amount)
        let crime_amount = premium ? amount * 2 : amount
        await this.client.psql.createTransaction({
            source: 4,
            received_by: message.author.id,
            given_at: Date.now(),
            amount: BigInt(crime_amount)
        })

        message.reply({
            content: message.author.toString(),
            embeds: [embed],
            components: [row]
        })
    }
}