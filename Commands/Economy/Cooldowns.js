import Command from "../../Structures/command.js"
import { EmbedBuilder } from "discord.js"

import moment from "moment"

export default class DailyCommand extends Command {
    constructor(client) {
        super(client, {
            name: "esperas",
            description: "Veja seus tempos de espera entre os comandos!",
            aliases: ['tempos', 'cooldowns', 'cd', 'cds', 'cooldown']
        })
    }

    async run(message, args) {
        let data = await this.client.psql.getCooldowns(message.author.id)

        let embed = new EmbedBuilder()

            .setColor(this.client.config.colors.default)
            .setTimestamp()
            .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })

            .setTitle('Tempos de espera')
            .setDescription(`${message.author.toString()}, aqui estão os seus tempos de espera entre o uso de alguns comandos!` + `\n>>> ${this.checkRemaitingTime(Number(data.daily), 'Diário')
                }\n${this.checkRemaitingTime(Number(data.weekly), 'Semanal')
                }\n${this.checkRemaitingTime(Number(data.work), 'Trabalho')
                }\n${this.checkRemaitingTime(Number(data.vote), 'Voto')
                }\n${this.checkRemaitingTime(Number(data.rep), 'Reputação')
                }`)

        return message.reply({
            content: message.author.toString(),
            embeds: [embed]
        })
    }

    checkRemaitingTime(timestamp, text) {
        if (timestamp > Date.now()) return `⏰ **${text}**: ${'Espere' + ` \`${this.client.utils.formatTime(timestamp, 2)}\`!`}`
        else return `✅ **${text}**: \`Comando disponível\`!`
    }
}