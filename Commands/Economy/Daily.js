import Command from "../../Structures/command.js"
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"

import moment from "moment"

export default class DailyCommand extends Command {
    constructor(client) {
        super(client, {
            name: "diário",
            description: "Colete sua recompensa diária!",
            aliases: ['daily', 'dailyprize', 'recompensa', 'dailyreward', 'recompensadiária', 'diario']
        })
    }

    async run(message, args) {
        let cds = await this.client.psql.getCooldowns(message.author.id, true)
        let data = await this.client.psql.getUser(message.author.id)

        let amount = this.client.utils.genNumber(2500, 12000)
        let next = new Date().setHours(24, 0, 0, 0)
        let premium = await this.client.psql.getUserPremium(message.author.id)

        if (Number(cds.daily) > Date.now()) return message.reply({
            content: `⏰ ${message.author.toString()}, espere \`${await this.client.utils.formatTime(Number(cds.daily), 2)}\` para poder utilizar esse comando novamente!`
        })

        let embed = new EmbedBuilder()

            .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })
            .setColor(this.client.config.colors.default)
            .setTimestamp()

            .setTitle('Recompensa diária')
            .setDescription(`${message.author.toString()}, parabéns, você coletou sua recompensa diária de hoje! Nela você ganhou **🪙 ${amount.toLocaleString()} moedas**! ${premium ? `\`(+${amount.toLocaleString()} bônus)\`` : ``}`)
            .setFields([
                {
                    name: 'Próxima recompensa',
                    value: `${moment(next).format('LLLL')}`,
                    inline: true
                }
            ])

        let row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Lembrar-me')
                    .setCustomId(`remind_${message.author.id}_${next}_daily`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔔')
                    .setDisabled(false)
            )

        await this.client.psql.updateCooldowns(message.author.id, 'daily', next)
        await this.client.psql.updateUserMoney(message.author.id, premium ? amount * 2 : amount)
        let daily_amount = premium ? amount * 2 : amount
        await this.client.psql.createTransaction({
            source: 3,
            received_by: message.author.id,
            given_at: Date.now(),
            amount: BigInt(daily_amount)
        })
        await this.client.psql.updateTasks(message.author.id, {
            daily: true
        })

        message.reply({
            content: message.author.toString(),
            embeds: [embed],
            components: [row]
        })
    }
}