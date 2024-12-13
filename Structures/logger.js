import Chalk from "chalk"
import Moment from "moment"

import { WebhookClient, EmbedBuilder, AttachmentBuilder } from "discord.js"

class Logger {
    constructor(client) {
        this.client = client
    }

    taxDaily(txt, arq_name) {
        let webhook = new WebhookClient({
            url: "https://discord.com/api/webhooks/1110388653265526804/2ApLMRXW02OJgB8JnMLCYkIQn7BuhTjPyexybl4fjINZzlVUgmYA2TvBxrfhwk5QAMCS"
        })

        let buff = Buffer.from(txt)
        let attachment = new AttachmentBuilder(buff, { name: arq_name })

        webhook.send({
            files: [attachment]
        })
    }

    async sponsoredDrop(data) {
        let webhook = new WebhookClient({
            url: "https://discord.com/api/webhooks/1095825707130695791/JmIhTayYuk2j3rqJwzAzV_k2nFmXtJXna4kUB66XSxdwCme13r8UCD2ZatXMzgJgGXGa"
        })

        let embed = new EmbedBuilder()

            .setColor(this.client.config.colors.blue)
            .setTimestamp()
            .setFooter({ text: data.author.tag, iconURL: data.author.avatar })

            .setFields([
                {
                    name: `Valor`,
                    value: `${data.amount.toLocaleString()}`,
                    inline: true
                },
                {
                    name: `Ganhadores`,
                    value: `${data.winners.toLocaleString()}`,
                    inline: true
                },
                {
                    name: `Feito por:`,
                    value: `${data.author.tag} (${data.author.id})`,
                    inline: true
                }
            ])

        webhook.send({
            content: `Novo sorteio patrocinado!`,
            username: 'Drop patrocinado',
            embeds: [embed]
        })

    }

    async drop(data) {
        let webhook = new WebhookClient({
            url: "https://discord.com/api/webhooks/1095825707130695791/JmIhTayYuk2j3rqJwzAzV_k2nFmXtJXna4kUB66XSxdwCme13r8UCD2ZatXMzgJgGXGa"
        })

        let embed = new EmbedBuilder()

            .setColor(this.client.config.colors.green)
            .setTimestamp()
            .setFooter({ text: data.author.tag, iconURL: data.author.avatar })

            .setFields([
                {
                    name: `Valor`,
                    value: `${data.amount.toLocaleString()}`,
                    inline: true
                },
                {
                    name: `Tempo`,
                    value: `${this.client.utils.formatTime(data.time + Date.now())}`,
                    inline: true
                },
                {
                    name: `Ganhadores`,
                    value: `${data.winners.toLocaleString()}`,
                    inline: true
                },
                {
                    name: `Feito por:`,
                    value: `${data.author.tag} (${data.author.id})`,
                    inline: true
                },
                {
                    name: 'Feito em',
                    value: `${data.where.guild_name} (${data.where.guild})\n${data.where.channel_name} (${data.where.channel})`,
                    inline: true
                }
            ])

        webhook.send({
            content: `Novo sorteio!`,
            username: 'Drop',
            embeds: [embed]
        })

    }

    async raffle(data) {
        let webhook = new WebhookClient({
            url: "https://discord.com/api/webhooks/1115123738258702416/ZVeYMLvNObYK-9GeQwI8gPhHiVq7UCxjUhwzAn2CY5W2KzNexjzG9qauTKO-VtsjwPmI"
        })

        let user_list = await Promise.all(data.users_arr.map(async (result, index) => {
            let u = await this.client.users.fetch(result.author)
            return `🔸 \`${index + 1}\`\ - \`@${u.tag}\`\ (\`${u.id}\`\) comprou **${parseInt(result.ticket_count).toLocaleString()}** bilhetes (\`${this.client.utils.calcPercentage(result.ticket_count, data.tickets_total, 2)}\`)`
        }))

        let embed = new EmbedBuilder()
            .setColor(this.client.config.colors.green)
            .setTimestamp()
            .setFooter({ text: data.winner.tag, iconURL: data.winner.avatar })

            .setTitle(`🏆 E o vencedor é...`)
            .setDescription(`O usuário vencedor é: \`${data.winner.tag} (${data.winner.id})\`\n\n- 💸 Valor da rifa: **${data.amount.toLocaleString()}**\n- 🎟️ Bilhetes Totais: **${data.tickets_total.toLocaleString()}**\n- ⭐ Bilhetes do ganhador: **${data.tickets.toLocaleString()}**\n- 🚀 Chance de ganhar: **${data.percent}**\n\nParticipantes: \n${user_list.join("\n")}`)

        webhook.send({
            content: `Novo resultado!`,
            username: 'Rifa do Kingg',
            avatarURL: 'https://cdn.discordapp.com/attachments/1095904293741154344/1193374625787285534/image.png?ex=65ac7bba&is=659a06ba&hm=a7e97a26432fd72d0729a239ae2ed6cbcb0a37787c039d94acac4d1959d8a3b7&',
            embeds: [embed]
        })

    }

    async ban(content) {
        let webhook = new WebhookClient({
            url: "https://discord.com/api/webhooks/1091780199630241843/BW7UvCC3wFjz258BRFM1xUg9rtldgUh63GMItcFkM5XrfI7Sm80c29fV8bIeCXpk3JOH"
        })

        let embed = new EmbedBuilder()

            .setColor(content.type === 'ban' ? this.client.config.colors.red : this.client.config.colors.green)
            .setTimestamp()
            .setFooter({ text: content.user.tag, iconURL: content.user.avatar })

            .setFields([
                {
                    name: `${content.type === 'ban' ? 'Usuário punido' : 'Punição removida de'}:`,
                    value: `${content.user.tag} (${content.user.id})`,
                    inline: true
                },
                {
                    name: `${content.type === 'ban' ? 'Punido(a) por' : 'Removida por'}:`,
                    value: `${content.author.tag} (${content.author.id})`,
                    inline: true
                },
                {
                    name: `Data:`,
                    value: `<t:${Math.floor(Date.now() / 1000)}> (<t:${Math.floor(Date.now() / 1000)}:R>)`,
                    inline: false
                },
                {
                    name: `Motivo`,
                    value: `${content.reason || 'Remoção de punição'}`,
                    inline: false
                }
            ])
            .setThumbnail(content.user.avatar)

        webhook.send({
            content: `Nova punição!`,
            username: 'Banimento',
            embeds: [embed]
        })

    }

    async payment(content) {
        let webhook = new WebhookClient({
            url: "https://discord.com/api/webhooks/1091887213052170240/BJ5HBsfT8D0e5CJVnY8cdCB5Cbrhbr2pOZ-3CvrsDLX3VCkfpru1F8cIloaJjNGrcp6p"
        })

        let embed = new EmbedBuilder()
            .setColor(content.type === 'payment' ? this.client.config.colors.green : this.client.config.colors.red)
            .setTimestamp()
            .setFooter({ text: content.user.tag, iconURL: content.user.avatar })

            .setFields([
                {
                    name: `${content.type === 'payment' ? 'Recebido por' : 'Retirado de'}:`,
                    value: `${content.user.tag} (${content.user.id})`,
                    inline: true
                },
                {
                    name: `${content.type === 'payment' ? 'Enviado por' : 'Retirado por'}:`,
                    value: `${content.author.tag} (${content.author.id})`,
                    inline: true
                },
                {
                    name: `Data:`,
                    value: `<t:${Math.floor(Date.now() / 1000)}> (<t:${Math.floor(Date.now() / 1000)}:R>)`,
                    inline: false
                },
                {
                    name: `Valor`,
                    value: `${content.amount.toLocaleString()} moedas`,
                    inline: false
                }
            ])
            .setThumbnail(content.user.avatar)

        webhook.send({
            content: `Novo pagamento!`,
            username: 'Pagamentos',
            embeds: [embed]
        })
    }
}

export default Logger