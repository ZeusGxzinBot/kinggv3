import Command from "../../Structures/command.js"

import ms from "ms"

import { Op } from "sequelize"
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"

import questions from "../../Assets/Json/questions.json" assert { type: 'json'}

export default class TriviaCommand extends Command {
    constructor(client) {
        super(client, {
            name: "trivia",
            description: "Chame um usuário para uma aposta de conhecimento, o Kingg irá fazer uma pergunta aleatória e o usuário que responder corretamente mais rápido leva o valor apostado.",
            aliases: ['triviabet', 'triviaquest', 'bettrivia'],
            usage: '<usuário> <valor>'
        })
    }

    async run(message, args) {
        let user = await this.client.utils.findUser(args[1], this.client, message, true)
        let author_data = await this.client.psql.getUser(message.author.id)

        if (!user || user.id == message.author.id) return message.reply({
            content: `❌ ${message.author.toString()}, diga-me um usuário válido para apostar!`
        })

        if (user.bot && user.id != this.client.user.id) return message.reply({
            content: `❌ ${message.author.toString()}, você não pode apostar com aplicações!`
        })

        let user_data = await this.client.psql.getUser(user.id)
        let amount = this.client.utils.formatNumber(args[1], author_data.money, user_data.money)

        if (isNaN(amount) || amount < 10 || amount > 1_000_000_000) return message.reply({
            content: `❌ ${message.author.toString()}, diga-me um valor válido para apostar!`
        })

        let premium = await this.client.psql.getUserPremium(message.author.id) || await this.client.psql.getUserPremium(user.id)
        let prize = premium ? amount : parseInt((amount / 100) * 95)

        if (author_data.money < amount) return message.reply({
            content: `❌ ${message.author.toString()}, você não tem saldo suficiente para completar essa aposta!`
        })

        if (user_data.money < amount) return message.reply({
            content: `❌ ${message.author.toString()}, esse usuário não tem saldo para completar essa aposta!`
        })

        let question = questions.questions[parseInt(Math.random() * questions.questions.length)],
            button = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Secondary)
                        .setCustomId('accept')
                        .setLabel("Aceitar")
                        .setEmoji('✅')
                )

        let msg = await message?.reply({
            content: `❓ ${user}, ${message.author} quer apostar com você em um jogo de perguntas \`(conhecimentos gerais)\` valendo **${Number(amount).toLocaleString()} moedas**, o usuário que responder a pergunta corretamente mais rápido leva o prêmio!`,
            components: [button]
        })

        let collector = msg?.createMessageComponentCollector({ time: 30000 })
        collector.on("collect", async (int) => {
            await int.deferUpdate().catch(() => { })
            if (int.customId === 'accept') {
                if (int.user.id != user.id) return

                user_data = await this.client.psql.getUser(user.id), author_data = await this.client.psql.getUser(message.author.id)

                if (author_data.money < amount || author_data.ban) return;
                if (user_data.money < amount || user_data.ban) return;
                await msg?.delete().catch(() => { })

                message?.channel.send(`✅ ${message.author} e ${user} preparem-se, o jogo está começando!`)

                await this.awaitTime(3000)
                return startGame(this.client)
            }
        })

        collector.on('end', () => {
            msg?.edit({ components: [] }).catch(() => { })
        })

        async function startGame(client) {

            user_data = await client.psql.getUser(user.id), author_data = await client.psql.getUser(message.author.id)

            if (author_data.money < amount || user_data.money < amount) return message.reply({
                content: `❌ ${message.author.toString()}, pelo visto algum de vocês não tem mais moedas para completar a aposta, o jogo foi cancelado!`
            })

            let bot_message = await message?.reply({ content: `❓ ${message.author} e ${user}, **o jogo começou**, a pergunta é \`${question.question}\``, })

            let win = false, collectorm = await message.channel.createMessageCollector({
                filter: (m) => {
                    if (m.author.id === message.author.id || m.author.id === user.id ? false : true) return false
                    if (!question.answers.includes(m.content.toLowerCase())) return false
                    return true
                },
                max: 1,
                time: 60000
            })

            collectorm.on('collect', async (m) => {
                win = true

                let winner = await client.users.fetch(m.author.id == message.author.id ? message.author.id : user.id),
                    loser = await client.users.fetch(m.author.id != user.id ? user.id : message.author.id)

                await client.psql.updateUserMoney(winner.id, prize), await client.psql.updateUserMoney(loser.id, -amount)

                let embed = new EmbedBuilder()

                    .setColor(client.config.colors.default)
                    .setFooter({ text: 'Respondido por @' + m.author.username, iconURL: m.author.displayAvatarURL() })
                    .setTimestamp()

                    .setTitle(`✅ Correto`)
                    .setDescription(question.description)

                m?.reply({
                    embeds: [embed],
                    content: `${m.author}, você adivinhou a resposta correta, parabéns! Você ganhou **${prize == amount ? amount.toLocaleString() : prize.toLocaleString()} moedas**${prize == amount ? `!` : `! (taxa de ${(amount - prize).toLocaleString()})`} ${loser} perdeu **${amount.toLocaleString()} moedas**.`
                })

                let tasks = await client.psql.getTasks(winner.id),
                    tasks2 = await client.psql.getTasks(loser.id)

                await client.psql.updateTasks(winner.id, {
                    bets: tasks.bets + 1
                })
                await client.psql.updateTasks(loser.id, {
                    bets: tasks2.bets + 1
                })
                await client.psql.transactions.create({
                    source: 21,
                    received_by: winner.id,
                    given_by: loser.id,
                    given_by_tag: winner.id === user.id ? user.tag : message.author.tag,
                    received_by_tag: winner.id !== user.id ? user.tag : message.author.tag,
                    given_at: Date.now(),
                    amount: amount
                })
            })

            collectorm.on('end', async () => {
                if (win) return;
                bot_message?.reply({
                    content: `⏰ ${message.author} e ${user}, como ninguém adivinhou a resposta, o jogo foi cancelado.`
                }).catch(() => { })
            })
        }
    }

    awaitTime(ms) {
        new Promise((resolve) => setTimeout(() => { resolve() }, ms))
    }
}