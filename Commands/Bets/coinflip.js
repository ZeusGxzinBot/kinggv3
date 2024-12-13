import Command from "../../Structures/command.js"

import ms from "ms"

import { Op } from "sequelize"
import { EmbedBuilder } from "discord.js"

export default class PayCommand extends Command {
    constructor(client) {
        super(client, {
            name: "apostar",
            description: "Aposte seu saldo com outro usuário em um jogo de probabilidade!",
            aliases: ['bet', 'betuser', 'aposta', 'animalsbet', 'betanimal'],
            usage: '<usuário> <valor>'
        })
    }

    async run(message, args) {
        if (['stats', 'estatisticas', 'estatísticas'].includes(args[0])) {
            let user = await this.client.utils.findUser(args[1], this.client, message, true)
            let author = await this.client.psql.getUser(message.author.id)

            let lose = {
                amount: 0,
                count: 0
            }, win = {
                amount: 0,
                count: 0
            }

            let bets = await this.client.psql.transactions.findAll({
                where: {
                    [Op.or]: {
                        received_by: user.id,
                        given_by: user.id
                    },
                    [Op.and]: {
                        source: 9
                    },
                },
                order: [['given_at', 'DESC']]
            }).then(x => x.map(y => y.dataValues))

            for (let bet of bets) {
                if (bet.received_by === user.id) {
                    win = {
                        amount: Number(bet.amount) + win.amount,
                        count: lose.count + 1
                    }
                }
                else {
                    lose = {
                        amount: Number(bet.amount) + lose.amount,
                        count: lose.count + 1
                    }
                }
            }

            message.reply({
                content: `${message.author.toString()} aqui estão ${user.id === message.author.id ? 'suas estatísticas de aposta' : `as estatisícas de aposta de ${user.toString()}`}!\n🎲 Apostou: \`${(lose.count + win.count).toLocaleString()} Vezes\`\n🏆 Ganhou: \`${win.count.toLocaleString()} Apostas\`\n😢 Perdeu: \`${lose.count.toLocaleString()} Apostas\`\n💰 Valor total: \`${(win.amount - lose.amount).toLocaleString()} moedas\`\n💵 Valor ganho: \`${win.amount.toLocaleString()} moedas\`\n💸 Valor perdido: \`${lose.amount.toLocaleString()} moedas\``
            })
        } else {
            let user = await this.client.utils.findUser(args[0], this.client, message, true), finished = false

            if (!user || user.id == message.author.id) return message.reply({
                content: `❌ ${message.author.toString()}, diga-me um usuário válido para apostar!`
            })

            if (user.bot && user.id != this.client.user.id) return message.reply({
                content: `❌ ${message.author.toString()}, você não pode apostar com aplicações!`
            })

            let author_data = await this.client.psql.getUser(message.author.id)
            let user_data = await this.client.psql.getUser(user.id)
            let amount = this.client.utils.formatNumber(args[1], author_data.money, user_data.money)

            if (isNaN(amount) || amount < 10 || amount > 1_000_000_000) return message.reply({
                content: `❌ ${message.author.toString()}, diga-me um valor válido para apostar!`
            })

            let animals = await this.getAnimals(user_data, author_data)
            let premium = await this.client.psql.getUserPremium(message.author.id) || await this.client.psql.getUserPremium(user.id)
            let prize = premium ? amount : parseInt((amount / 100) * 95)

            if (author_data.money < amount) return message.reply({
                content: `❌ ${message.author.toString()}, você não tem saldo suficiente para completar essa aposta!`
            })

            if (user_data.money < amount) return message.reply({
                content: `❌ ${message.author.toString()}, esse usuário não tem saldo para completar essa aposta!`
            })

            let bot_message = await message.reply({
                content: `${user.toString()}, ${message.author.toString()} quer fazer uma aposta você valendo 🪙 **${amount.toLocaleString()} moedas**!\nPara confirmar a aposta, os dois devem clicar em ✅.\nSe ${animals[message.author.id]} vencer, ${message.author.toString()} ganha **${prize.toLocaleString()} moedas**!\nSe ${animals[user.id]} vencer, ${user.toString()} ganha **${prize.toLocaleString()} moedas**!`
            })
            bot_message.react('✅')

            let filter = (reaction, user) => reaction.emoji.name === `✅` && [user.id, message.author.id].includes(user.id)
            let collector = bot_message.createReactionCollector({
                filter: filter,
                time: ms('5m')
            })

            collector.on('collect', async (r, u) => {
                if (finished) return;

                let rac = bot_message.reactions.cache.get('✅').users.cache.map(x => x.id)

                if (rac.includes(user.id) && rac.includes(message.author.id)) {
                    finished = true, collector.stop()

                    author_data = await this.client.psql.getUser(message.author.id), user_data = await this.client.psql.getUser(user.id)

                    if (author_data.money < amount || author_data.ban) return;
                    if (user_data.money < amount || user_data.ban) return;

                    let winner = [user.id, message.author.id][Math.floor(Math.random() * 2)],
                        loser = [user.id, message.author.id].filter(x => x != winner)[0]

                    let tasks = await this.client.psql.getTasks(loser),
                        tasks2 = await this.client.psql.getTasks(winner)

                    await this.client.psql.updateUserMoney(loser, -amount)
                    await this.client.psql.updateUserMoney(winner, prize)

                    await this.client.psql.updateTasks(loser, {
                        bets: tasks.bets + 1
                    })
                    await this.client.psql.updateTasks(winner, {
                        bets: tasks2.bets + 1
                    })

                    await this.client.psql.transactions.create({
                        source: 9,
                        received_by: winner,
                        given_by: loser,
                        given_by_tag: winner === user.id ? user.tag : message.author.tag,
                        received_by_tag: winner !== user.id ? user.tag : message.author.tag,
                        given_at: Date.now(),
                        amount: amount
                    })

                    await bot_message.reply({
                        content: `O ${winner == message.author.id ? animals[message.author.id] : animals[user.id]} de <@${winner}> venceu o combate!\nSendo assim, <@${winner}> recebeu 🪙 **${prize.toLocaleString()} moedas**${premium ? '' : ` (${(amount - prize).toLocaleString()} de taxa)`} financiadas por <@${loser}>!`,
                    })
                }
            })
        }
    }

    async getAnimals(data1, data2) {
        let is_premium = await this.client.psql.getUserPremium(data1.id)
        let is_premium_2 = await this.client.psql.getUserPremium(data2.id)
        let animals = [
            '🐶', '🐺', '🐱', '🦁', '🐯',
            '🦒', '🐭', '🐗', '🐷', '🐮',
            '🦝', '🦊', '🐹', '🐰', '🐻',
            '🐻‍❄️', '🐨', '🐼', '🐲', '🐔',
            '🦄', '🐴', '🦓', '🐸', '🐾',
            '🐒', '🦍', '🦧', '🦮', '🐅',
            '🐈‍⬛', '🐈', '🐕', '🐩', '🐕‍🦺',
            '🐆', '🐎', '🦌', '🦬', '🦏',
            '🦛', '🐑', '🐖', '🐄', '🕷️',
            '🐃', '🐂', '🐐', '🐪', '🐫',
            '🦙', '🦘', '🦥', '🦨', '🦡',
            '🦣', '🐘', '🐁', '🐀', '🐊',
            '🦎', '🦫', '🐿️', '🐇', '🦔',
            '🐢', '🐍', '🐉', '🦕', ',🦦',
            ',🦈', '🐬', '🦭', '🐳', '🐋',
            '🐟', '🦞', '🐙', '🦑', '🦐',
            '🐡', '🐠', '🐚', '🦀', '🦆',
            '🐓', '🦃', '🦅', '🦉', '🦚',
            '🦩', '🦜', '🦢', '🕊️', '🦤',
            '🪶', '🐦', '🐧', '🐥', '🐤',
            '🐣', '🦇', '🦋', '🐌', '🐛',
            '🦟', '🪰', '🪱', '🦗', '🐜',
            '🪳', '🐝', '🦂', '🪲', '🐞',
        ]

        return {
            [data1.id]: is_premium && data1.bet_emoji != null ? data1.bet_emoji : animals[Math.floor(Math.random() * animals.length)],
            [data2.id]: is_premium_2 && data2.bet_emoji != null ? data2.bet_emoji : animals[Math.floor(Math.random() * animals.length)]
        }
    }
}