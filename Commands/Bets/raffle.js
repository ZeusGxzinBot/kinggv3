import Command from "../../Structures/command.js"

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"

import moment from "moment"

moment.locale('pt-br')

export default class RaffleCommand extends Command {
    constructor(client) {
        super(client, {
            name: "rifa",
            description: "Veja informações da rifa ou compre um bilhete para apostar nela!",
            aliases: ['raffle', 'kingraffle', 'rifaking', 'rifakingg', 'kinggraffle'],
            usage: '[buy <quantidade>]'
        })
    }

    async run(message, args) {
        let data = await this.client.psql.getRaffleData(message.client.user.id)

        let row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId('raffle_part')
                    .setEmoji('👤')
                    .setLabel('Participantes')
            )

        let authorTickets = await this.client.psql.ticketCounter({ author: message.author.id })

        if (['buy', 'comprar', 'compra'].includes(args[0])) {
            let author_data = await this.client.psql.getUser(message.author.id)
            let amount = this.client.utils.formatNumber(args[1])

            if (isNaN(amount) || amount < 1 || amount > 100_000) return message.reply({
                content: `❌ ${message.author.toString()}, me informe uma quantia válida de bilhetes entre 1 e 100.000!`
            });

            let value = amount * 250

            if (value > author_data.money) return message.reply({
                content: `❌ ${message.author.toString()}, você não tem saldo suficiente para comprar essa quantidade de bilhetes! **(necessário +${(value - Number(author_data.money)).toLocaleString()})**`
            })

            if (100_000 < (authorTickets + amount)) return message.reply({
                content: `❌ ${message.author.toString()}, você só pode comprar até 100.000 bilhetes por rifa!`
            })
            let tasks = await this.client.psql.getTasks(message.author.id)
            await this.client.psql.updateUserMoney(message.author.id, -value)
            await this.client.psql.transactions.create({
                source: 8,
                given_by: message.author.id,
                given_by_tag: message.author.tag,
                given_at: Date.now(),
                amount: value
            })
            await this.client.psql.updateRaffle(message.author, message.client.user.id, amount)
            await this.client.psql.updateTasks(message.author.id, {
                raffle: tasks.raffle + amount
            })

            message.reply({
                content: `✅ ${message.author.toString()}, você comprou **${amount.toLocaleString()} Bilhetes** por **${value.toLocaleString()} moedas**, o resultado dessa rifa sairá em <t:${Math.floor(Number(data.ends_in) / 1000)}> (<t:${Math.floor(Number(data.ends_in) / 1000)}:R>)`
            })
        } else if (['info', 'informacoes'].includes(args[0])) {
            let users = await this.client.psql.getRaffleUsers()
            let rf_info = await this.client.psql.getRaffleData(this.client.user.id)
            let msg = await Promise.all(users.map(async (result, index) => {
                let u = await this.client.users.fetch(result.author)
                return `\`${index + 1}\`\ - \`${u.tag}\`\ (\`${u.id}\`\) comprou **${parseInt(result.ticket_count).toLocaleString()} tickets (${this.client.utils.calcPercentage(result.ticket_count, rf_info.total, 2)}).**`
            }))

            let embed = new EmbedBuilder()

                .setFooter({ text: '@' + this.client.user.username, iconURL: this.client.user.displayAvatarURL() })
                .setColor(this.client.config.colors.default)
                .setTimestamp()

                .setTitle('Participantes')
                .setDescription(msg.length >= 1 ? msg.join("\n") : 'Ninguém')

            message.reply({
                embeds: [embed]
            })

        } else {
            let last_winner = await this.client.users.fetch(data.last_winner).catch(e => { null }) || { id: '0', tag: 'Fulano#0000' }

            message.reply({
                content: `${message.author.toString()} **Rifa**\n🏆 Prêmio atual: **${data.quantity.toLocaleString()} moedas**\n🎟️ Bilhetes comprados: **${data.total.toLocaleString()}**\n⭐ Usuários participando: **${data.participants.toLocaleString()}**\n💸 Último vencedor: \`${last_winner.tag} (${last_winner.id})\` **(${data.last_value.toLocaleString()} moedas)**\n⏰ Resultado será divulgado em: **${moment(Number(data.ends_in)).format('LLLL')} (${this.client.utils.formatTime(Number(data.ends_in), 2)})**\nPara participar, compre um bilhete por **250 moedas** utilizando \`krifa comprar\`!`,
                components: [row]
            })
        }
    }
}

