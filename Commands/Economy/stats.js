import Command from "../../Structures/command.js"

import { ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder } from "discord.js"
import { Op } from "sequelize"

export default class StatsCommand extends Command {
    constructor(client) {
        super(client, {
            name: "estatísticas",
            description: "Veja suas estatísticas de aposta!",
            aliases: ['betstats', 'estatisticas', 'stats'],
            usage: null
        })
    }

    async run(message, args) {
        let row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setPlaceholder('Estatísticas')
                    .setDisabled(false)
                    .setMaxValues(1)
                    .setMinValues(1)
                    .addOptions([
                        {
                            label: `Apostas`,
                            emoji: `💸`,
                            description: `Apostas com outros usuários!`,
                            value: `bets`
                        },
                        {
                            label: `Corridas`,
                            emoji: `🏁`,
                            description: `Corridas com 2 pessoas ou mais!`,
                            value: `races`
                        }
                    ])
                    .setCustomId(`stats_${message.author.id}`)
            )

        let embed = new EmbedBuilder()

            .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })
            .setColor(this.client.config.colors.default)
            .setTimestamp()

            .setTitle(`📊 Estatísticas de aposta`)
            .setDescription(`Olá, ${message.author.toString()}! Para visualizar as suas estatísticas de aposta, utilize o menu de seleção abaixo para escolher qual tipo de aposta deseja ter esse tipo de informação!`)

        let bot_message = await message.reply({
            content: message.author.toString(),
            components: [row],
            embeds: [embed]
        })

        let collector = bot_message.createMessageComponentCollector({
            filter: (int) => int.user.id === message.author.id,
            time: 180_000
        })

        collector.on('collect', async (i) => {
            await i.deferUpdate().catch((e) => { null })
            let win, lose, bets
            switch (i.values[0]) {
                case 'bets':
                    lose = { amount: 0, count: 0 }, win = { amount: 0, count: 0 }
                    bets = await this.client.psql.transactions.findAll({
                        where: { [Op.or]: { received_by: message.author.id, given_by: message.author.id }, [Op.and]: { source: 9 }, },
                        order: [['given_at', 'DESC']]
                    }).then(x => x.map(y => y.dataValues))

                    for (let bet of bets) {
                        if (bet.received_by === message.author.id) win = { amount: Number(bet.amount) + win.amount, count: lose.count + 1 }
                        else lose = { amount: Number(bet.amount) + lose.amount, count: lose.count + 1 }
                    }

                    if (bets.length < 2) return i.reply({
                        content: `❌ ${i.user.toString()}, você não tem transações suficientes para serem mostradas aqui.`
                    })

                    embed.setFields({
                        name: `Estatísticas do \`${await this.client.psql.getGuildPrefix(message.guild.id)}apostar\``,
                        value: `- 🎲 Apostou: \`${(lose.count + win.count).toLocaleString()} Vezes\`\n- 🏆 Ganhou: \`${win.count.toLocaleString()} Apostas\` \`(${this.client.utils.calcPercentage(win.count, win.count + lose.count)})\`\n- 😢 Perdeu: \`${lose.count.toLocaleString()} Apostas\` \`(${this.client.utils.calcPercentage(win.count, win.count + lose.count)})\`\n- 💰 Lucro/Prejuízo: \`${(win.amount - lose.amount).toLocaleString()} moedas\`\n- 💵 Valor ganho: \`${win.amount.toLocaleString()} moedas\`\n- 💸 Valor perdido: \`${lose.amount.toLocaleString()} moedas\``
                    })

                    bot_message.edit({
                        embeds: [embed]
                    })
                    break;
                case 'races':
                    lose = { amount: 0, count: 0 }, win = { amount: 0, count: 0 }
                    bets = await this.client.psql.transactions.findAll({
                        where: { [Op.or]: { received_by: message.author.id, given_by: message.author.id }, [Op.and]: { source: 6 }, },
                        order: [['given_at', 'DESC']]
                    }).then(x => x.map(y => y.dataValues))

                    for (let bet of bets) {
                        if (bet.received_by === message.author.id) win = { amount: Number(bet.amount) + win.amount, count: lose.count + 1 }
                        else lose = { amount: Number(bet.amount) + lose.amount, count: lose.count + 1 }
                    }

                    if (bets.length < 2) return i.reply({
                        content: `❌ ${i.user.toString()}, você não tem transações suficientes para serem mostradas aqui.`
                    })

                    embed.setFields({
                        name: `Estatísticas do \`${await this.client.psql.getGuildPrefix(message.guild.id)}corrida\``,
                        value: `- 🎲 Apostou: \`${(lose.count + win.count).toLocaleString()} Vezes\`\n- 🏆 Ganhou: \`${win.count.toLocaleString()} Apostas\` \`(${this.client.utils.calcPercentage(win.count, win.count + lose.count)})\`\n- 😢 Perdeu: \`${lose.count.toLocaleString()} Apostas\` \`(${this.client.utils.calcPercentage(win.count, win.count + lose.count)})\`\n- 💰 Lucro/Prejuízo: \`${(win.amount - lose.amount).toLocaleString()} moedas\`\n- 💵 Valor ganho: \`${win.amount.toLocaleString()} moedas\`\n- 💸 Valor perdido: \`${lose.amount.toLocaleString()} moedas\``
                    })

                    bot_message.edit({
                        embeds: [embed]
                    })
                    break;
                default:
                    break;
            }
        })
    }
}