import Command from "../../Structures/command.js"

import { EmbedBuilder } from "discord.js"
import ms from 'ms'

export default class DropCommand extends Command {
    constructor(client) {
        super(client, {
            name: "drop",
            aliases: [],
            description: "Comando restrito!"
        })
    }

    async run(message, args) {
        if (!Object.values(this.client.config.permissions).includes(message.author.id) && !process.env.OWNER_ID.includes(message.author.id)) return;

        let amount = this.client.utils.formatNumber(args[0], 100_000, 0, 0)
        let time = ms(args[1] || '1m')
        let winners = parseInt(args[2]), users = []

        if (!winners || isNaN(winners) || winners > 40 || winners < 2) winners = 1

        if ((isNaN(amount) || amount < 1 || amount > 1_000_000_000)) return;

        if (isNaN(time)) return;

        await this.client.logger.drop({
            author: {
                id: message.author.id,
                tag: message.author.tag,
            },
            amount: amount,
            winners: winners,
            time: time,
            where: {
                guild: message.guild.id,
                guild_name: message.guild.name,
                channel: message.channel.id,
                channel_name: message.channel.name
            }
        })

        let embed = new EmbedBuilder()

            .setColor(this.client.config.colors.green)
            .setTimestamp()
            .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL() })

            .setTitle("Drop")
            .setDescription(`Clique na reação abaixo para participar!`)

            .addFields([
                {
                    name: 'Valor',
                    value: `**${amount.toLocaleString()}** moedas`,
                    inline: true
                },
                {
                    name: 'Ganhadores',
                    value: `${winners}`,
                    inline: true
                },
                {
                    name: 'Finaliza em',
                    value: `<t:${parseInt((Date.now() + time) / 1000)}:R>`,
                    inline: true
                },
                {
                    name: 'Ganhador(es)',
                    value: `Ninguém, ainda.`,
                    inline: false
                }
            ])

        let bot_message = await message.channel.send({
            embeds: [embed]
        })
        bot_message.react('🎉')

        let filter = (reaction, user) => ['🎉'].includes(reaction.emoji.name) && !user.bot
        let collector = bot_message.createReactionCollector({
            filter: filter,
            time: time
        })

        collector.on('collect', async (reaction, user) => {
            try {
                if (users.includes(user.id)) return;
                users.push(user.id)
            } catch (e) {
                console.log(e)
            }
        })

        collector.on('end', async () => {
            if (users.length < 1) return;
            if (winners > users.length) winners = users.length

            let winner_list = []

            for (let i = 0; i < winners; i++) {
                let user = users[parseInt(Math.random() * users.length)]
                winner_list.push(user)
                users = users.filter(x => x != user)
            }

            for (let i of winner_list) {
                await this.client.psql.updateUserMoney(i, amount)
                await this.client.psql.createTransaction({
                    source: 11,
                    received_by: i,
                    given_at: Date.now(),
                    amount: amount
                })
            }

            let fields = bot_message.embeds[0].data

            fields.fields[3] = {
                name: `Ganhadores`,
                value: `${winner_list.map(u => `<@${u}>`).join(', ')}`,
                inline: false
            }

            bot_message?.edit({ embeds: [fields] })
            bot_message?.reply({
                content: `${winner_list.map(u => `<@${u}>`).join(', ')} **parabéns**! ${winner_list.length > 1 ? 'vocês ganharam' : 'você ganhou'} 🪙 **${amount.toLocaleString()} moedas** nesse sorteio!`
            })
        })
    }
}