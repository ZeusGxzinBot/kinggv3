import Command from "../../Structures/command.js"

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js"

export default class RaceCommand extends Command {
    constructor(client) {
        super(client, {
            name: "cavalos",
            description: "Aposte em uma corrida de cavalos, o mais rápido vence!",
            aliases: ['horses', 'horsesrace', 'corridadecavalos'],
            usage: '<valor>'
        })
    }

    async run(message, args) {
        let author_data = await this.client.psql.getUser(message.author.id)
        let premium = await this.client.psql.getUserPremium(message.author.id)
        let amount = this.client.utils.formatNumber(args[0], author_data.money, 0, 150_000)

        let horses = [
            { points: 0, name: 'Amarelo', emoji: '🟨', id: 'yellow' },
            { points: 0, name: 'Roxo', emoji: '🟪', id: 'purple' },
            { points: 0, name: 'Azul', emoji: '🟦', id: 'blue' },
            { points: 0, name: 'Branco', emoji: '⬜', id: 'white' },
            { points: 0, name: 'Preto', emoji: '⬛', id: 'black' }
        ]
        let choice = null

        if (!amount || isNaN(amount) || amount === 0 || amount > 10_000_000_000) return message.reply({
            content: `❌ ${message.author.toString()}, me informe uma quantia válida para apostar!`
        });

        if (author_data.money < amount) return message.reply({
            content: `❌ ${message.author.toString()}, você não tem saldo suficiente para fazer essa aposta!`
        });

        if (amount < 100 || amount > 150_000) return message.reply({
            content: `❌ ${message.author.toString()}, o valor da aposta precisa ser maior que 100 moedas e menor que 150.000!`
        });

        if (author_data.bets >= 30 && !premium || author_data.bets >= 50 && premium) return message.reply({
            content: `❌ ${message.author.toString()}, você atingiu o limite de apostas por hora, tente novamente mais tarde!${premium ? '' : ' (Aumente seu limite para **50** virando **VIP**)'}`
        })

        await this.client.psql.updateUserBets(message.author.id, 1)

        let row = new ActionRowBuilder()

            .addComponents(
                new ButtonBuilder()
                    .setCustomId('horse-0-yellow')
                    .setEmoji('🟨')
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel('Amarelo'),
                new ButtonBuilder()
                    .setCustomId('horse-1-purple')
                    .setEmoji('🟪')
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel('Roxo'),
                new ButtonBuilder()
                    .setCustomId('horse-2-blue')
                    .setEmoji('🟦')
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel('Azul'),
                new ButtonBuilder()
                    .setCustomId('horse-3-white')
                    .setEmoji('⬜')
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel('Branco'),
                new ButtonBuilder()
                    .setCustomId('horse-4-black')
                    .setEmoji('⬛')
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel('Preto')
            )

        let bot_message = await message.reply({
            content: `🏇 ${message.author.toString()}, escolha uma **cor** de cavalo para lhe **respresentar** nessa corrida!\n**Lembre-se** de que essa corrida irá valer **🪙 ${amount.toLocaleString()} moedas**.`,
            components: [row]
        })

        let filter = interaction => interaction.user.id == message.author.id;
        let collector = bot_message.createMessageComponentCollector({
            filter,
            time: 60_000
        })

        collector.on('collect', async (i) => {
            await i.deferUpdate().catch((e) => { null })

            if (i.user.id != message.author.id) return;

            let check = await this.client.psql.getUser(message.author.id)

            if (check.money < amount) return;
            await this.client.psql.updateUserMoney(message.author.id, -amount)

            collector.stop('success')

            let { customId: id } = i

            bot_message.components[0].components[0].data.disabled = true
            bot_message.components[0].components[1].data.disabled = true
            bot_message.components[0].components[2].data.disabled = true
            bot_message.components[0].components[3].data.disabled = true
            bot_message.components[0].components[4].data.disabled = true

            bot_message.components[0].components[id.split('-')[1]].data.style = ButtonStyle.Primary
            choice = id.split('-')[2]

            const embed = new EmbedBuilder()

                .setColor(this.client.config.colors.blue)
                .setDescription(this.sortHorses(horses).join('\n'))

            bot_message = await bot_message.edit({
                content: `🏇 ${message.author.toString()}, você apostou **🪙 ${amount.toLocaleString()} moedas** no cavalo de cor \"${bot_message.components[0].components[id.split('-')[1]].data.emoji.name}\"!\nEm suas marcas... Preparar... Vai!:`,
                components: bot_message.components,
                embeds: [embed]
            })

            for (let i = 0; i < 5; i++) {
                if (!message) break;

                await this.awaitTime(1000)
                await this.editMessage(bot_message, horses)
            }

            await this.getWinner(bot_message, horses, choice, amount, message.author.id)
        })
    }

    sortHorses(horses) {
        let arr = []

        horses = horses.sort((a, b) => b.points - a.points)

        for (let horse of horses) {
            arr.push(`🏇 ${"\-".repeat(Math.floor(horse.points))} ${horse.emoji} (${horse.points.toFixed(2)})`)
        }

        return arr
    }

    addPoints(horses) {
        let i = 0
        for (let horse of horses) {
            horses[i].points = horses[i].points + (Math.random() * 4)
            i++
        }
    }

    async getWinner(message, horses, choice, amount, id) {
        let win = horses.findIndex(x => x.id === choice) + 1 < 3
        let draw = horses.findIndex(x => x.id === choice) + 1 === 3

        if (draw) {
            await this.client.psql.updateUserMoney(id, amount)
        } else {
            if (win) {
                await this.client.psql.updateUserMoney(id, horses.findIndex(x => x.id === choice) + 1 == 1 ? amount * 2 : (parseInt(amount / 2)) + parseInt(amount))
                await this.client.psql.createTransaction({
                    source: 18,
                    received_by: id,
                    given_at: Date.now(),
                    amount: horses.findIndex(x => x.id === choice) + 1 == 1 ? amount : (parseInt(amount / 2)) + parseInt(amount),
                    users: horses
                })
            } else {
                await this.client.psql.createTransaction({
                    source: 18,
                    given_by: id,
                    given_at: Date.now(),
                    amount: amount,
                    users: horses
                })
            }
        }
        let tasks = await this.client.psql.getTasks(id)

        await this.client.psql.updateTasks(id, {
            bets: tasks.bets + 1
        })

        message.embeds[0].data.fields = [{
            name: 'Resultado',
            value: `O cavalo **${horses[0].name}** (${horses[0].emoji}) venceu!\nSeu cavalo ficou em ${horses.findIndex(x => x.id === choice) + 1}° lugar! ${draw ?
                `Suas **🪙 ${amount.toLocaleString()}** moedas foram devolvidas!` :
                !win ?
                    `Você perdeu as **🪙 ${amount.toLocaleString()}** moedas!`
                    : horses.findIndex(x => x.id === choice) + 1 == 1 ?
                        `Você ganhou **🪙 ${amount.toLocaleString()}** moedas!`
                        : `Você ganhou **🪙 ${parseInt(amount / 2).toLocaleString()}** moedas!`
                }`,
            inline: true
        }]

        message.edit({
            embeds: message.embeds
        })
    }

    async editMessage(message, horses) {
        this.addPoints(horses)

        message.embeds[0].data.description = this.sortHorses(horses).join('\n')

        message.edit({
            embeds: message.embeds
        })
    }

    async awaitTime(ms) {
        await new Promise((resolve) => {
            setTimeout(() => { resolve() }, ms)
        })
    }
}