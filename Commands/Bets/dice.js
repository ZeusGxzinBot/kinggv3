import Command from "../../Structures/command.js"

import ms from "ms"

import { Op } from "sequelize"
import { EmbedBuilder } from "discord.js"

export default class DiceCommand extends Command {
    constructor(client) {
        super(client, {
            name: "dice",
            description: "Aposte utilizando um dado de 6 lados!",
            aliases: ['dices', 'dice', 'dado'],
            usage: '<valor>'
        })
    }

    async run(message, args) {
        let author_data = await this.client.psql.getUser(message.author.id)
        let premium = await this.client.psql.getUserPremium(message.author.id)
        let amount = this.client.utils.formatNumber(args[0], author_data.money, 0, 150_000)

        if (!amount || isNaN(amount) || amount === 0 || amount > 10_000_000_000) return message.reply({
            content: `❌ ${message.author.toString()}, me informe uma quantia válida para apostar!`
        });

        if (author_data.money < amount) return message.reply({
            content: `❌ ${message.author.toString()}, o valor da aposta precisa ser maior que 100 moedas e menor que 150.000!`
        });

        if (amount < 100 || amount > 150_000) return message.reply({
            content: `❌ ${message.author.toString()}, você não tem saldo suficiente para fazer essa aposta!`
        });

        if (author_data.bets >= 30 && !premium || author_data.bets >= 50 && premium) return message.reply({
            content: `❌ ${message.author.toString()}, você atingiu o limite de apostas por hora, tente novamente mais tarde!${premium ? '' : ' (Aumente seu limite para **50** virando **VIP**)'}`
        })

        await this.client.psql.updateUserBets(message.author.id, 1)
        let bot_message = await message.reply({
            content: `🎲 ${message.author.toString()}, rolando os dados...`
        })

        await this.client.psql.updateUserMoney(message.author.id, -amount)

        setTimeout(async () => {
            let dices = {
                one: Math.floor(Math.random() * 6) + 1,
                two: Math.floor(Math.random() * 6) + 1,
                three: Math.floor(Math.random() * 6) + 1,
                four: Math.floor(Math.random() * 6) + 1
            }

            let result = dices.one + dices.two > dices.three + dices.four
            let draw = dices.one + dices.two === dices.three + dices.four

            const embed = new EmbedBuilder()
                .setColor(draw ? this.client.config.colors.yellow : result ? this.client.config.colors.green : this.client.config.colors.red)
                .setTimestamp()
                .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL() })

                .setTitle('Rolagem de dados')
                .setDescription(`${message.author.toString()}\n> 🎲 Dado 1: **${dices.one}** | 🎲 Dado 2: **${dices.two}**\n> Total: **${dices.one + dices.two} Pontos**\n\n${this.client.user.toString()}\n> 🎲 Dado 1: **${dices.three}** | 🎲 Dado 2: **${dices.four}**\n> Total: **${dices.three + dices.four} Pontos**`)
                .setFields([
                    {
                        name: 'Resultado',
                        value: draw ? 'Houve um empate, suas moedas foram devolvidas?' : result === false ? `${message.author.toString()} perdeu 🪙 **${amount.toLocaleString()} moedas**, pois, obteu menos pontos que ${this.client.user.toString()}!`
                            : `${message.author.toString()} ganhou 🪙 **${amount.toLocaleString()} moedas**, pois, obteu mais pontos que ${this.client.user.toString()}!`,
                        inline: false
                    }
                ])

            if (draw) {
                await this.client.psql.updateUserMoney(message.author.id, amount)
            } else {
                if (result) {
                    await this.client.psql.updateUserMoney(message.author.id, amount * 2)
                    await this.client.psql.transactions.create({
                        source: 15,
                        received_by: message.author.id,
                        given_at: Date.now(),
                        amount: BigInt(amount)
                    })
                } else {
                    await this.client.psql.transactions.create({
                        source: 15,
                        given_by: message.author.id,
                        given_at: Date.now(),
                        amount: BigInt(amount)
                    })
                }
            }
            let tasks = await this.client.psql.getTasks(message.author.id)

            await this.client.psql.updateTasks(message.author.id, {
                bets: tasks.bets + 1
            })

            message.reply({ embeds: [embed] })

        }, 3_000);
    }

}