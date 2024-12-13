import Command from "../../Structures/command.js"

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"

export default class WorkCommand extends Command {
    constructor(client) {
        super(client, {
            name: "trabalhar",
            description: "Trabalhe em troca de alguns trocados!",
            aliases: ['work', 'job', 'dowork', 'dojob', 'trabalho']
        })
    }

    async run(message, args) {
        let cds = await this.client.psql.getCooldowns(message.author.id)
        let data = await this.client.psql.getUser(message.author.id)
        let worker = await this.client.psql.getWorker(message.author.id)
        let tasks = await this.client.psql.getTasks(message.author.id)

        let exp = Math.floor(Math.random() * 4) + 3
        let phrases = {
            doctor: [
                "diagnosticou e tratou com sucesso um paciente",
                "realizou uma cirurgia bem-sucedida",
                "ofereceu atendimento de emergência"
            ],
            farmer: [
                "colheu uma safra abundante",
                "você ajudou a renovar a beleza dos campos",
                "cuidou dos animais da fazenda"
            ],
            engineer: [
                "supervisionou com sucesso a construção de uma ponte",
                "evitou uma potencial catástrofe"
            ],
            policeofficer: [
                "resolveu um caso complexo",
                "impediu um roubo.",
                "mediou um conflito"
            ],
            firefighter: [
                "resgatou um animal de estimação preso em uma árvore",
                "combateu com bravura um incêndio"
            ]
        }

        if (worker.job == null) return message.reply({
            content: `❌ ${message.author.toString()}, você precisa de um emprego para poder trabalhar, utilize o comando \`${await this.client.psql.getGuildPrefix(message.guild.id)}empregos\` para conseguir um emprego!`
        })

        if (Number(cds.work) > Date.now()) return message.reply({
            content: `⏰ ${message.author.toString()}, espere \`${await this.client.utils.formatTime(Number(cds.work), 2)}\` para poder utilizar esse comando novamente!`
        })

        let embed = new EmbedBuilder()

            .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })
            .setColor(this.client.config.colors.default)
            .setTimestamp()

            .setTitle(`Trabalho ${this.client.config.jobs[worker.job].name}`)
            .setDescription(`${message.author.toString()}, você **${phrases[worker.job][Math.floor(Math.random() * phrases[worker.job].length)]}** e recebeu **🪙 ${worker.salary.toLocaleString()} moedas** pelo seu ótimo trabalho!`)

            .setFields([
                {
                    name: `Recompensas`,
                    value: `+ **${worker.salary.toLocaleString()}** moedas 🪙\n+ **${exp}** Experiência(s) ✨`,
                    inline: true
                },
                {
                    name: `Tempo de espera`,
                    value: `\`${this.client.utils.formatTime(Date.now() + this.client.config.jobs[worker.job].cooldown)}\``,
                    inline: true
                }
            ])

        let row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Lembrar-me')
                    .setCustomId(`remind_${message.author.id}_${Date.now() + this.client.config.jobs[worker.job].cooldown}_work`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔔')
                    .setDisabled(false)
            )

        await this.client.psql.updateCooldowns(message.author.id, 'work', Date.now() + this.client.config.jobs[worker.job].cooldown)
        await this.client.psql.updateUserMoney(message.author.id, worker.salary)
        await this.client.psql.addWorkerExp(message.author.id, exp, 'farmer')
        await this.client.psql.updateTasks(message.author.id, { work: tasks.work + 1 })
        await this.client.psql.createTransaction({
            source: 5,
            received_by: message.author.id,
            given_at: Date.now(),
            amount: BigInt(worker.salary)
        })

        message.reply({
            content: message.author.toString(),
            embeds: [embed],
            components: [row]
        })
    }
}