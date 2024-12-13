import Command from "../../Structures/command.js"

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"

export default class WorkCommand extends Command {
    constructor(client) {
        super(client, {
            name: "trabalhador",
            description: "Trabalhe em troca de alguns trocados!",
            aliases: ['worker', 'workerprofile', 'perfildotrabalhador']
        })
    }

    async run(message, args) {
        let cooldown = await this.client.psql.getCooldowns(message.author.id)
        let data = await this.client.psql.getUser(message.author.id)
        let worker = await this.client.psql.getWorker(message.author.id)

        if (worker.job == null) return message.reply({
            content: `❌ ${message.author.toString()}, você precisa de um emprego para poder ver isso, utilize o comando \`${await this.client.psql.getGuildPrefix(message.guild.id)}empregos\` para conseguir um emprego!`
        })

        let embed = new EmbedBuilder()

            .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })
            .setColor(this.client.config.colors.default)
            .setTimestamp()

            .setTitle(`Perfil de trabalho - @${message.author.username}`)
            .setDescription(`${message.author.toString()}, aqui estão algumas informações sobre o seu emprego!`)

            .setFields([
                {
                    name: `Emprego atual`,
                    value: `\`${this.client.config.jobs[worker.job].name}\``,
                    inline: true
                },
                {
                    name: `Nível`,
                    value: `\`${worker.level.toLocaleString()} - [${worker.exp.toLocaleString()}/${worker.req.toLocaleString()}]\``,
                    inline: true
                },
                {
                    name: `Tempo de espera`,
                    value: `\`${this.client.utils.formatTime(Date.now() + this.client.config.jobs[worker.job].cooldown)}\``,
                    inline: true
                },
                {
                    name: `Salário atual`,
                    value: `${worker.salary.toLocaleString()} moedas 🪙`,
                    inline: true
                },
                {
                    name: `Salário inicial`,
                    value: `${this.client.config.jobs[worker.job].initial_salary.toLocaleString()} moedas 🪙`,
                    inline: true
                },
                {
                    name: `Salário por nível`,
                    value: `${this.client.config.jobs[worker.job].salary_per_level.toLocaleString()} moedas 🪙`,
                    inline: true
                },
                {
                    name: `Progresso`,
                    value: `[${this.client.utils.stringProgressBar(worker.exp, worker.req, 10, '🟩', '⬛')}]`,
                    inline: true
                }
            ])

        message.reply({
            content: message.author.toString(),
            embeds: [embed]
        })
    }
}