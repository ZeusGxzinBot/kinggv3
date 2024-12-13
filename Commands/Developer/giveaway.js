import Command from "../../Structures/command.js";
import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js"
import ms from "ms"

export default class GiveawayCommand extends Command {
    constructor(client) {
        super(client, {
            name: "Sorteio",
            description: "Patrocine um sorteio",
            aliases: ['sorteio', 'giveaway'],
            usage: ''
        })
    }

    async run(message, args) {
        // let user = await this.client.psql.getUser(message.author.id)
        // let row = new ActionRowBuilder()
        //     .addComponents(
        //         new ButtonBuilder()
        //             .setStyle(ButtonStyle.Primary)
        //             .setEmoji('🗑')
        //             .setLabel('Cancelar')
        //             .setCustomId('a')
        //     )

        // let question = 0
        // let giveaway = {}

        // let filter = (collector) => message.author.id == collector.author.id
        // const collector = message.channel.createMessageCollector({ filter, time: 300000 })
        // message.reply({ content: 'Qual o titulo do sorteio?' }).then(m => setTimeout(() => m.delete(), 9000))

        // collector.on('collect', async (msg) => {
        //     if (msg.content == "cancelar") {
        //         msg
        //         collector.stop()
        //     }

        //     if (question == 0) {
        //         giveaway.title = msg.content
        //         question++
        //         return message.reply({ content: 'Quanto tempo de sorteio?' }).then(m => setTimeout(() => m.delete(), 9000))
        //     }
        //     if (question == 1) {
        //         let time = ms(msg.content)
        //         if (!time || time > 7200000 || time < 3600000) return message.reply({
        //             content: "Tempo inválido"
        //         })
        //         giveaway.time = msg.content
        //         question++
        //         return message.reply({ content: 'Quantas magias?' }).then(m => setTimeout(() => m.delete(), 9000))
        //     }
        //     if (question == 2) {
        //         let amount = this.client.utils.formatNumber(msg.content, user.money)
        //         if (!amount || amount < 100000) return message.reply({
        //             content: "Valor inválido"
        //         })

        //         if (amount > user.money) return message.reply({
        //             content: "Você não tem esse valor"
        //         })

        //         giveaway.money = amount
        //         question++
        //         return message.reply({ content: 'Quantos ganhadores?' }).then(m => setTimeout(() => m.delete(), 9000))

        //     }
        //     if (question == 3) {
        //         if (isNaN(msg.content)) return message.reply({
        //             content: "Total de ganhadores inválido"
        //         })
        //         giveaway.winners = msg.content
        //         question++
        //         return message.reply({ content: 'Qual será o requisito?' }).then(m => setTimeout(() => m.delete(), 9000))
        //     }
        //     if (question == 4) {
        //         giveaway.req = msg.content
        //         let channel = await this.client.channels.cache.get("1082539637664383036")
        //         channel.send({
        //             content: `> Titulo : ${giveaway.title}\n> Tempo: ${this.client.utils.formatTime(Date.now() + parseInt(ms(giveaway.time)))}\n> Magias: ${giveaway.money.toLocaleString()}\n> Ganhadores: ${giveaway.winners}\n> Requisito: ${giveaway.req}`
        //         })

        //         await this.client.psql.updateUserMoney(user.id, -giveaway.money)
        //         await this.client.psql.createTransaction({
        //             source: 2,
        //             received_by: user.id,
        //             received_by_tag: user.tag,
        //             given_at: Date.now(),
        //             amount: BigInt(giveaway.money)
        //         })
        //         collector.stop()
        //     }
        // })
    }
}
