import Command from "../../Structures/command.js"

import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js"
import Package from '../../package.json' assert { type: "json" };

const unit = ["", "K", "M", "G", "T", "P"]

export default class HelpCommand extends Command {
    constructor(client) {
        super(client, {
            name: "botinfo",
            description: "Veja algumas informações sobre minha aplicação!",
            aliases: ['infobot', 'kingg', 'king', 'info']
        })
    }

    async run(message, args) {
        let row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setURL(this.client.config.links.invitation_url)
                    .setStyle(ButtonStyle.Link)
                    .setLabel('Me adicione'),
                new ButtonBuilder()
                    .setURL(this.client.config.links.official_guild)
                    .setStyle(ButtonStyle.Link)
                    .setLabel('Servidor oficial')
            )

        let embed = new EmbedBuilder()

            .setColor(this.client.config.colors.default)
            .setTimestamp()
            .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })

            .setAuthor({ name: `${this.client.user.username} - Informações`, iconURL: this.client.user.displayAvatarURL() })
            .setDescription(`${message.author.toString()}, Olá! Eu me chamo **${this.client.user.username}**, e sou uma aplicação feita no **Discord**, focada em **economia**! Eu fui criado em **<t:${Math.floor(this.client.user.createdTimestamp / 1000)}>**, por \`@ttmatheus\`. Abaixo estão algumas outras informações.`)
            .setThumbnail(this.client.user.displayAvatarURL())

            .setFields([
                {
                    name: `Servidores`,
                    value: `${await this.client.shard.fetchClientValues('guilds.cache.size').then(gd => gd.reduce((acc, guildCount) => acc + guildCount, 0).toLocaleString())} Servidores`,
                    inline: true
                },
                {
                    name: "Usuários",
                    value: `${await this.client.psql.users.count().then(data => data.toLocaleString())} Usuários`,
                    inline: true
                },
                {
                    name: "Comandos",
                    value: `${this.client.commands.size.toLocaleString()} Comandos`,
                    inline: true
                },
                {
                    name: "Ajuda",
                    value: `Meu comando de ajuda nesse servidor é ${await this.client.psql.getGuildPrefix(message.guild.id)}ajuda.`,
                    inline: false
                },
                {
                    name: "Versão",
                    value: '`' + Package.version + "`",
                    inline: true
                },
                {
                    name: "Latência",
                    value: '`' + this.client.ws.ping + 'ms`',
                    inline: true
                },
                {
                    name: "Uso de Memória",
                    value: `\`${this.bytesToSize(process.memoryUsage().rss, 2)}\``,
                    inline: true
                },
                {
                    name: "Tempo Ativo",
                    value: `\`${this.client.utils.formatTime(this.client.readyTimestamp, 2)}\``,
                    inline: false
                }
            ])


        return message.reply({
            content: message.author.toString(),
            components: [row],
            embeds: [embed]
        })
    }

    bytesToSize(input, precision) {
        let unit = ["", "K", "M", "G", "T", "P"];
        let index = Math.floor(Math.log(input) / Math.log(1024))

        if (unit >= unit.length) return input + "B"
        return ((input / Math.pow(1024, index)).toFixed(precision) + " " + unit[index] + "B")
    }
}