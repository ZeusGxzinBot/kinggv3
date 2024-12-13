import Command from "../../Structures/command.js"

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } from "discord.js"
import { Op } from "sequelize"

export default class transactionsCommand extends Command {
    constructor(client) {
        super(client, {
            name: "transações",
            description: "Veja suas últimas mil transações ou as de outro usuário!",
            aliases: ['transactions', 'tr', 'trs', 'transacoes'],
            usage: '[usuário]'
        })
    }

    async run(message, args) {
        let user = await this.client.utils.findUser(args[1], this.client, message, true)
        let transactions = [], page = 0
        let source_filter = []
        let tr_counter = 0

        if (args[0]?.length >= 3) page = this.checkPage(args[1]), user = await this.client.utils.findUser(args[0], this.client, message, true)
        else page = this.checkPage(args[0])
        let data = await this.client.psql.getTransactions(user.id, 10, 0)

        transactions = await this.transctionPage(data, user)
        tr_counter = await this.client.psql.getTrCounter(user.id)

        let bet_counter = await this.client.psql.getTrCounter(user.id, [5, 6, 7, 12, 13])

        let row = new ActionRowBuilder()

            .addComponents(
                new ButtonBuilder()
                    .setCustomId('back')
                    .setDisabled(false)
                    .setEmoji('⬅️')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setDisabled(false)
                    .setEmoji('➡️')
                    .setStyle(ButtonStyle.Secondary)
            )
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('tr_menu')
                .setPlaceholder('Escolha qual categoria você deseja ver!')
                .setMaxValues(11)
                .setMinValues(1)
                .addOptions([
                    {
                        "label": "Pagamento dos administradores",
                        "value": "2",
                        "emoji": "👮"
                    },
                    {
                        "label": "Coleta do prêmio diário",
                        "value": "3",
                        "emoji": "💸"
                    },
                    {
                        "label": "Coleta do prêmio semanal",
                        "value": "4",
                        "emoji": "💵"
                    },
                    {
                        "label": "Trabalho",
                        "value": "5",
                        "emoji": "💼"
                    },
                    {
                        "label": "Corridas",
                        "value": "6",
                        "emoji": "🏁"
                    },
                    {
                        "label": "Pagamentos",
                        "value": "7",
                        "emoji": "🤑"
                    },
                    {
                        "label": "Rifa",
                        "value": "8",
                        "emoji": "🎟️"
                    },
                    {
                        "label": "Apostas com outro usuário",
                        "value": "9",
                        "emoji": "🎲"
                    },
                    {
                        "label": "Taxa do inatividade (diário)",
                        "value": "10",
                        "emoji": "⚠️"
                    },
                    {
                        "label": "Drops",
                        "value": "11",
                        "emoji": "🎁"
                    },
                    {
                        "label": "Crimes",
                        "value": "12",
                        "emoji": "🔫"
                    },
                    {
                        "label": "21/Blackjack",
                        "value": "13",
                        "emoji": "🃏"
                    },
                    {
                        "label": "Tarefas diárias",
                        "value": "14",
                        "emoji": "📅"
                    },
                    {
                        "label": "Dados",
                        "value": "15",
                        "emoji": "🎲"
                    },
                    {
                        "label": "Fundos de perfil",
                        "value": "16",
                        "emoji": "💳"
                    },
                    {
                        "label": "Taxa de inatividade (apostas)",
                        "value": "17",
                        "emoji": "💸"
                    },
                    {
                        "label": "Corrida de cavalos",
                        "value": "18",
                        "emoji": "🏇"
                    },
                    {
                        "label": "Caça-níqueis",
                        "value": "19",
                        "emoji": "🎰"
                    },
                    {
                        "label": "Palavra do dia",
                        "value": "20",
                        "emoji": "📖"
                    },
                    {
                        "label": "Quiz",
                        "value": "21",
                        "emoji": "❓"
                    },
                    {
                        "label": "Benefício de impulso",
                        "value": "22",
                        "emoji": "🚀"
                    },
                    {
                        "label": "Campo minado",
                        "value": "23",
                        "emoji": "💣"
                    },
                    {
                        "label": "Coleta da recompensa VIP",
                        "value": "24",
                        "emoji": "🌟"
                    }
                ])

        )

        let embed = new EmbedBuilder()

            .setFooter({ text: `${tr_counter.toLocaleString()} Transações - ${bet_counter} Apostas - @${user.username}`, iconURL: user.displayAvatarURL() })
            .setColor(this.client.config.colors.green)
            .setTimestamp()

            .setTitle(`Transações de @${user.username} - (${page + 1}/${(tr_counter % 10) < 6 ? (Math.round(tr_counter / 10) + 1) : Math.round(tr_counter / 10)})`)
            .setDescription(this.sliceTransaction(transactions, 0) || 'Nenhuma transação aqui!')

        let bot_message = await message.reply({
            content: message.author.toString(),
            embeds: [embed],
            components: [menu, row]
        })

        let filter = interaction => interaction.user.id == message.author.id;
        let collector = bot_message.createMessageComponentCollector({
            filter,
            time: 180_000
        })

        collector.on('collect', async (i) => {
            await i.deferUpdate().catch((e) => { null })
            if (i.values) {
                page = 0
                source_filter = i.values
                transactions = []

                if (source_filter == 2) source_filter = [1, 2]
                let tr_fil = await this.client.psql.getTransactions(user.id, 10, 0, source_filter)
                tr_counter = await this.client.psql.getTrCounter(user.id, source_filter)
                transactions = await this.transctionPage(tr_fil, user)

                embed.setTitle(`Transações de @${user.username} - (${page + 1}/${(tr_counter % 10) < 6 ? (Math.round(tr_counter / 10) + 1) : Math.round(tr_counter / 10)})`)
                embed.setDescription(this.sliceTransaction(transactions, 0) || 'Nenhuma transação aqui')
                embed.setFooter({ text: `${tr_counter.toLocaleString()} Transações - ${bet_counter} Apostas - @${user.username}`, iconURL: user.displayAvatarURL() })

                bot_message.edit({
                    embeds: [embed],
                    components: [menu, row]
                })
            } else {
                let { customId: id } = i

                if (id === "back") {
                    page -= 1
                    if (page < 0) page = parseInt((tr_counter - 1) / 10)
                } else {
                    page += 1
                    if ((page * 10) > tr_counter - 1) page = 0
                }
                let transactions_arr = await this.client.psql.getTransactions(user.id, 10, page, source_filter)
                transactions = await this.transctionPage(transactions_arr, user)

                embed.setTitle(`Transações de @${user.username} - (${page + 1}/${(tr_counter % 10) < 6 ? (Math.round(tr_counter / 10) + 1) : Math.round(tr_counter / 10)})`)
                embed.setDescription(this.sliceTransaction(transactions, 0) || 'Nenhuma transação aqui')
                embed.setFooter({ text: `${tr_counter.toLocaleString()} Transações - ${bet_counter} Apostas - @${user.username}`, iconURL: user.displayAvatarURL() })

                bot_message.edit({
                    embeds: [embed],
                    components: [menu, row]
                })
            }

        })

        collector.on('end', async () => {
            await bot_message.edit({
                embeds: [embed],
                components: []
            })
        })
    }

    checkPage(Page) {
        if (Page)
            if (Page > 100 || Page < 1) Page = 0
            else Page = Page - 1
        else Page = 0
        return parseInt(Page)
    }

    sliceTransaction(transaction, page) {
        return transaction.slice(page * 10, (page * 10) + 10).join("\n")
    }

    async transctionPage(data, user) {
        let transactions = []
        for (let i of data) {
            transactions.push(await this.client.psql.displayTransaction(i, user))
        }
        return transactions
    }

}