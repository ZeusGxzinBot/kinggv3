import Command from "../../Structures/command.js"

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } from "discord.js"
import { Op } from "sequelize"
import reputations from "../../Database/Models/reputations.js"

export default class ReputationsCommand extends Command {
    constructor(client) {
        super(client, {
            name: "reputações",
            description: "Veja suas últimas mil reputações ou as de outro usuário!",
            aliases: ['reputations', 'reps'],
            usage: '[usuário]'
        })
    }

    async run(message, args) {
        let user = await this.client.utils.findUser(args[1], this.client, message, true)
        let reputations = [], page = 0
        let type = 'all'
        if (args[0]?.length >= 3) page = this.checkPage(args[1]), user = await this.client.utils.findUser(args[0], this.client, message, true)
        else page = this.checkPage(args[0])
        let data = await this.client.psql.getReps(user.id, 10, 0, type)
        let reps_count = await this.client.psql.countReps(user.id, type)

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
                .setCustomId('menu')
                .setPlaceholder('Escolha qual categoria você deseja ver!')
                .setMaxValues(1)
                .setMinValues(1)
                .addOptions([{
                    label: 'Reputações Recebidas',
                    description: 'Veja as reputações que você já rebeceu',
                    value: "received",
                    emoji: "📥"
                },
                {
                    label: 'Reputações dadas',
                    description: 'Veja as reputações que você já enviou',
                    value: "sent",
                    emoji: "📤"
                }
                ])
        )

        let embed = new EmbedBuilder()

            .setFooter({ text: `${reps_count.toLocaleString()} Reputações - ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setColor(this.client.config.colors.red)
            .setTimestamp()

            .setTitle(`Reputações de @${user.username} - (${page + 1}/${(reps_count % 10) < 6 ? (Math.round(reps_count / 10) + 1) : Math.round(reps_count / 10)})`)
            .setDescription(this.slice_rep(data, user))

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
            let menuvalue = i.values
            if (menuvalue) {
                page = 0
                if (menuvalue[0] == 'sent') {
                    page = 0
                    type = 'sent'
                }

                if (menuvalue[0] == 'received') {
                    page = 0
                    type = 'received'
                }
            }

            let { customId: id } = i

            if (id === "back") {
                page -= 1
                if (page < 0) page = parseInt((reps_count - 1) / 10)
            } else if (id === "next") {
                page += 1
                if ((page * 10) > reps_count) page = 0
            }

            reps_count = await this.client.psql.countReps(user.id, type)
            reputations = await this.client.psql.getReps(user.id, 10, page, type)

            embed.setTitle(`Reputações de @${user.username} - (${page + 1}/${(reps_count % 10) < 6 ? (Math.round(reps_count / 10) + 1) : Math.round(reps_count / 10)})`)
            embed.setDescription(this.slice_rep(reputations, user))
            embed.setFooter({ text: `${reps_count} Reputações - ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })

            bot_message.edit({
                embeds: [embed]
            })
        })

        collector.on('end', async () => {
            await bot_message.edit({
                embeds: [embed],
                components: []
            })
        })
    }

    slice_rep(data, user) {
        let reputations = []
        for (let i of data) {
            reputations.push(this.transformRepToText(i, user))
        }
        reputations = reputations.length == 0 ? 'Nenhuma reputação aqui!' : reputations.join("\n")
        return reputations
    }

    checkPage(Page) {
        if (Page)
            if (Page > 100 || Page < 1) Page = 0
            else Page = Page - 1
        else Page = 0
        return parseInt(Page)
    }

    transformRepToText(data, user, t) {
        return `[<t:${Math.floor(data.given_at / 1000)}:d> <t:${Math.floor(data.given_at / 1000)}:T>] ${data.received_by === user.id ? '📥 Recebida de' : '📤 Enviada para'} \`${data.received_by === user.id ? data.given_by_tag : data.received_by_tag}\` \`(${data.received_by === user.id ? data.given_by : data.received_by})\` ${data.message ? `com a mensagem \`${data.message}\`` : ''}`
    }
}