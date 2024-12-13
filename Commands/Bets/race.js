import Command from "../../Structures/command.js"

import { EmbedBuilder } from "discord.js"

import ms from "ms"

export default class RaceCommand extends Command {
    constructor(client) {
        super(client, {
            name: "corrida",
            description: "Abra uma batalha apostada com limite de até 25 usuários, quem tiver mais sorte leva o montante!",
            aliases: ['race', 'usersrace', 'corridadeusuários', 'corridadeusuarios', 'carsrace', 'corridadecaros'],
            usage: '<valor> [limite]'
        })
    }

    async run(message, args) {
        let data = await this.client.psql.getUser(message.author.id),
            amount = this.client.utils.formatNumber(args[0], data.money),
            limit = parseInt(args[1])
        let users = [await this.getCar(message.author.id, data)]

        if (!limit || isNaN(limit) || limit > 20) limit = 20
        if (limit < 2) limit = 2

        if ((isNaN(amount) || amount < 10 || amount > 10_000_000_000)) return message.reply({
            content: `❌ ${message.author.toString()}, você precisa especificar um valor válido para abrir uma corrida!`
        })

        if (data.money < amount) return message.reply({
            content: `❌ ${message.author.toString()}, você não tem saldo suficiente para abrir uma corrida nesse valor!`
        })

        let embed = new EmbedBuilder()

            .setColor(this.client.config.colors.default)
            .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })
            .setTimestamp()

            .setTitle('Corrida 🏁')
            .setDescription(`${message.author.toString()}, você iniciou uma nova corrida no valor de **${amount.toLocaleString()} moedas**, haverá apenas **um ganhador** nela! A mesma será finalizada em **60 segundos**, mas, você pode finalizá-la clicando em ✅.`)

            .setFields([
                {
                    name: 'Valor',
                    value: `🪙 **${amount.toLocaleString()}** moedas`,
                    inline: true
                },
                {
                    name: 'Ganhador(es)',
                    value: 'Ninguém ainda',
                    inline: true
                },
                {
                    name: `Participantes (1/${limit})`,
                    value: users.map(u => `${u.car} <@${u.id}>`).join('\n'),
                    inline: false
                }
            ])

        const bot_message = await message.reply({
            content: message.author.toString(),
            embeds: [embed]
        })
        bot_message.react('🏁'), bot_message.react('✅')

        let filter = (reaction, user) => [`✅`, `🏁`].includes(reaction.emoji.name) && !user.bot
        let collector = bot_message.createReactionCollector({
            filter: filter,
            time: ms('1m')
        })

        collector.on('collect', async (reaction, user) => {
            if (reaction.emoji.name == '✅' && user.id === message.author.id) return collector.stop()
            if (reaction.emoji.name == '🏁' && user.id !== message.author.id) {
                try {
                    if (users.map(x => x.id).includes(user.id)) return;

                    let user_verification = await this.client.psql.getUser(user.id)

                    if (users.length >= limit) return;
                    if (user_verification.ban) return;
                    if (user_verification.money >= amount) users.push(await this.getCar(user.id, user_verification))
                    else return;

                    let fields = bot_message.embeds[0].data

                    fields.fields[0] = {
                        name: 'Valor',
                        value: `🪙 **${(amount * users.map(x => x.id).length).toLocaleString()}** moedas`,
                        inline: true
                    }, fields.fields[2] = {
                        name: `Participantes (${users.length}/${limit})`,
                        value: users.map(u => `${u.car} <@${u.id}>`).join('\n'),
                        inline: false
                    }

                    bot_message?.edit({ embeds: [fields] })

                    if (users.length >= limit) return collector.stop()
                } catch (e) {
                    console.log(e)
                }
            }
        })

        const users_arr = []

        collector.on('end', async () => {
            for (let i of users) {
                let check = await this.client.psql.getUser(i.id)

                if (check.ban === true) continue;
                if (check.money >= amount) users_arr.push(i)
            }

            if (users_arr.length < 2) {
                return message.reply({
                    content: `❌ ${message.author.toString()}, não tinha participantes o suficiente nessa corrida para a mesma ser finalizada!`
                })
            } else {
                let winner = users_arr[parseInt(Math.random() * users_arr.length)],
                    total_prize = parseInt((amount * users_arr.length) - amount)
                let winner_prize = await this.client.psql.getUserPremium(winner.id) ? total_prize : parseInt((total_prize / 100) * 95)

                for (let i of users_arr) {
                    if (winner.id === i.id) {
                        await this.client.psql.updateUserMoney(i.id, winner_prize)
                        await this.client.psql.createTransaction({
                            source: 6,
                            received_by: i.id,
                            given_at: Date.now(),
                            amount: BigInt(winner_prize),
                            users: users_arr
                        })
                    } else {
                        await this.client.psql.updateUserMoney(i.id, -amount)
                        await this.client.psql.createTransaction({
                            source: 6,
                            given_by: i.id,
                            given_at: Date.now(),
                            amount: BigInt(amount),
                            users: users_arr
                        })
                    }
                    let tasks = await this.client.psql.getTasks(i.id)

                    await this.client.psql.updateTasks(i.id, {
                        bets: tasks.bets + 1
                    })
                }

                let fields = bot_message.embeds[0].data

                fields.fields[0] = {
                    name: 'Valor',
                    value: `🪙 **${(total_prize + amount).toLocaleString()}** moedas`,
                    inline: true
                }, fields.fields[1] = {
                    name: 'Ganhador(es)',
                    value: `<@${winner.id}>`,
                    inline: true
                }, fields.fields[2] = {
                    name: `Participantes (${users_arr.length}/${limit})`,
                    value: users.map(u => `${u.car} <@${u.id}>`).join('\n'),
                    inline: false
                }

                bot_message?.edit({ embeds: [fields] })
                bot_message?.reply({
                    content: `${winner.car} **Venceu a corrida**! Sendo assim <@${winner.id}> ganhou 🪙 **${winner_prize.toLocaleString()} moedas**! ${(total_prize - winner_prize) === 0 ? '' : `\`(${(total_prize - winner_prize).toLocaleString()} de taxa)\``}\n${users_arr.filter(x => x.id != winner.id).length < 2 ? `<@${users_arr.filter(x => x.id != winner.id)[0].id}> perdeu **${amount.toLocaleString()} moedas** nessa corrida.` : `<@${users_arr.filter(x => x.id != winner.id)[0].id}> e os outros **${users_arr.length - 2} Participantes** perderam **${amount.toLocaleString()} moedas** nessa corrida.`}`
                })
            }
        })
    }

    async getCar(id, data) {
        const cars = ['🚗', '🚓', '🚕', '🛺', '🚙', '🛻', '🚌', '🚐', '🚎', '🚑', '🚒', '🚚', '🚛', '🚜', '🚲', '🛴', '🛵', '🏍️', '🏎️', '🚅', '✈️', '🪂', '🛩️', '🚁', '🚀', '🛸', '🚤', '⛵', '🚢']
        let is_premium = await this.client.psql.getUserPremium(id)
        return {
            id: id,
            car: is_premium && data.bet_emoji != null ? data.bet_emoji : cars[Math.floor(Math.random() * cars.length)]
        }
    }
}