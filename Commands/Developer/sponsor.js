import Command from "../../Structures/command.js"

import { EmbedBuilder } from "discord.js"
import ms from 'ms'

export default class SponsorCommand extends Command {
    constructor(client) {
        super(client, {
            name: "patrocinado",
            aliases: [],
            description: "Comando restrito!"
        })
    }

    async run(message, args) {
        let data = await this.client.psql.getUser(message.author.id)
        let channels = ['1099162579600953437', '1104547477635465326', '1104523250756755486', '1099162571359142010']
        let time = ms(args[1] || '1m')
        if (isNaN(time)) return;

        if (data.money < 100000) return;
        if (!channels.includes(message.channel.id)) return;

        let amount = this.client.utils.formatNumber(args[0], data.money, 0, 0)
        let users = []

        if ((isNaN(amount) || amount < 20_000 || amount > 100_000_000)) return;
        if (data.money < amount) return message.reply({
            content: `❌ ${message.author.toString()}, você não tem saldo suficiente para fazer esse drop!`
        })
        await this.client.psql.updateUserMoney(message.author.id, -amount)
        await this.client.logger.sponsoredDrop({
            author: {
                id: message.author.id,
                tag: message.author.tag,
            },
            amount: amount,
            winners: 1
        })

        let embed = new EmbedBuilder()

            .setColor(this.client.config.colors.green)
            .setTimestamp()
            .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL() })

            .setTitle("Drop")
            .setDescription(`Um novo drop foi patrocinado por ${message.author} \`(${message.author.id})\`, esse drop será finalizado <t:${parseInt((Date.now() + time) / 1000)}:R>!`)

            .addFields([
                {
                    name: 'Valor',
                    value: `**${amount.toLocaleString()}** Magias`,
                    inline: true
                },
                {
                    name: 'Ganhadores',
                    value: `1`,
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
            if (users.length < 1) return await this.client.psql.updateUserMoney(message.author.id, amount)

            let winner_list = []

            for (let i = 0; i < 1; i++) {
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
                content: `${winner_list.map(u => `<@${u}>`).join(', ')} **parabéns**! ${winner_list.length > 1 ? 'vocês ganharam' : 'você ganhou'} 🪙 **${amount.toLocaleString()} Magias** no drop de ${message.author}!`
            })
        })
    }
}
