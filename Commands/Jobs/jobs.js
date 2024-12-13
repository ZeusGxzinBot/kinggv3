import Command from "../../Structures/command.js"

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from "discord.js"

export default class JobsCommand extends Command {
    constructor(client) {
        super(client, {
            name: "empregos",
            description: "Escolha uma empresa para trabalhar e ganhar dinheiro!",
            aliases: ['jobs', 'trabalhos']
        })
    }

    async run(message, args) {
        let worker = await this.client.psql.getWorker(message.author.id)

        if (worker.job != null) return message.reply({
            content: `❌ ${message.author.toString()}, você você já tem um emprego atualmente, caso queira desistir do seu emprego atual e perder seu progresso, utilize o comando \`${await this.client.psql.getGuildPrefix(message.guild.id)}demissão\`!`
        })

        let options = []

        for (let i of Object.keys(this.client.config.jobs)) {
            options.push({
                label: this.client.config.jobs[i].name,
                description: `Salário inicial: ${this.client.config.jobs[i].initial_salary.toLocaleString()} | Salário por nível: ${this.client.config.jobs[i].salary_per_level.toLocaleString()} | Tempo: ${this.client.utils.formatTime(Date.now() + this.client.config.jobs[i].cooldown)}`,
                value: `${i}`
            })
        }

        let menu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setPlaceholder('Escolher emprego')
                    .setDisabled(false)
                    .setMaxValues(1)
                    .setMinValues(1)
                    .addOptions(options)
                    .setCustomId(`jobs_${message.author.id}`)
            )

        let embed = new EmbedBuilder()

            .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })
            .setColor(this.client.config.colors.default)
            .setTimestamp()

            .setTitle(`Escolha seu emprego`)
            .setDescription(`👨‍⚕️ Escolha um emprego no menu abaixo para começar a trabalhar e ganhar dinheiro.\nSeu salário inicial aumentará à medida que você subir de nível. 📈`)
            .setThumbnail(this.client.user.displayAvatarURL())

        let bot_message = await message.reply({
            content: message.author.toString(),
            components: [menu],
            embeds: [embed]
        })

        let filter = interaction => interaction.user.id == message.author.id;
        let collector = bot_message.createMessageComponentCollector({
            filter,
            time: 60_000
        })

        collector.on('collect', async (i) => {
            await i.deferUpdate().catch((e) => { null })
            let worker = await this.client.psql.getWorker(message.author.id)

            if (worker.job != null) return;

            await this.client.psql.updateWorker(message.author.id, {
                job: i.values[0],
                join_date: Date.now(),
                salary: this.client.config.jobs[i.values[0]].initial_salary
            })

            let embed = new EmbedBuilder()

                .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })
                .setColor(this.client.config.colors.default)
                .setTimestamp()

                .setTitle(`✅ ${this.client.config.jobs[i.values[0]].name}`)
                .setDescription(`Seu novo emprego \`(${this.client.config.jobs[i.values[0]].name})\` foi escolhido com sucesso! Utilize o comando \`${await this.client.psql.getGuildPrefix(message.guild.id)}trabalhar\` para ganhar moedas e subir de nível!`)

                .setFields([
                    {
                        name: `Salário inicial`,
                        value: `${this.client.config.jobs[i.values[0]].initial_salary.toLocaleString()} moedas 🪙`,
                        inline: true
                    },
                    {
                        name: `Salário por nível`,
                        value: `+ ${this.client.config.jobs[i.values[0]].salary_per_level.toLocaleString()} moedas 🪙`,
                        inline: true
                    },
                    {
                        name: `Tempo`,
                        value: `${this.client.utils.formatTime(Date.now() + this.client.config.jobs[i.values[0]].cooldown)}`,
                        inline: true
                    }
                ])

            await bot_message.edit({
                embeds: [embed],
                components: []
            })
        })
    }
}