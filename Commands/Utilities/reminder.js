import Command from "../../Structures/command.js"
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } from "discord.js"

export default class Reminder extends Command {
    constructor(client) {
        super(client, {
            name: "lembrar",
            description: "Defina um lembrete ou veja sua lista de lembretes atuais!",
            aliases: ['lembrete', 'reminder', 'remind', 'remindme'],
            usage: '<lembrete>'
        })
    }

    async run(message, args) {
        let reminder_name = args.slice(0).join(' ')

        if (args.length == 0) return message.reply({
            content: `❌ ${message.author.toString()}, você precisa me falar um nome válido para criar o lembrete ou utilizar o parâmetro \`lista\`!`
        })

        if (['list', 'lista'].includes(reminder_name)) {
            let reminders = await this.client.psql.getAllReminders(message.author.id)

            if (reminders.length == 0) return message.reply({
                content: `❌ ${message.author.toString()}, você não tem lembretes para mostrar!"`
            })

            let reminder_menu = await this.fillMenu(message)
            let embed = new EmbedBuilder()

                .setAuthor({ name: `@${message.author.username} - Lembretes`, iconURL: message.author.displayAvatarURL() })
                .setDescription(`Você tem atualmente ${reminders.length} lembretes ativos!`)

                .setTimestamp()
                .setColor(this.client.config.colors.green)
                .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })

            let menu_message = await message.reply({
                embeds: [embed],
                components: [reminder_menu]
            })

            let filter = interaction => interaction.user.id == message.author.id;
            let collector = menu_message.channel.createMessageComponentCollector({
                filter,
                time: 180_000
            })

            collector.on('collect', async (i) => {
                await i.deferUpdate().catch((e) => { null })

                if (i.componentType == 2) {
                    let split = i.customId.split("_")

                    await this.client.psql.deleteReminder(split[3])

                    embed.setDescription(`Você tem atualmente ${reminders.length - 1} lembretes ativos!`)

                    reminder_menu = await this.fillMenu(message, t)

                    return menu_message.edit({
                        embeds: [embed],
                        components: reminder_menu == null ? [] : [reminder_menu],
                        ephemeral: true
                    })
                }

                let menu_value = i.values[0]
                let reminder = await this.client.psql.getReminder(message.author.id, menu_value)
                let reminder_date = new Date(parseInt(reminder.created_at) + parseInt(reminder.time)).toLocaleString()
                let date_formated = this.client.utils.formatTime(parseInt(reminder.created_at) + parseInt(reminder.time), 2)
                let channel = await this.client.channels.fetch(reminder.channel)
                let reminder_embed = new EmbedBuilder()

                    .setAuthor({ name: `@${message.author.username} - Lembretes`, iconURL: message.author.displayAvatarURL() })
                    .setColor(this.client.config.colors.green)
                    .setTimestamp()

                    .setTitle('Lembrete')
                    .addFields([{
                        name: `Data do lembrete`,
                        value: `*${reminder_date}** (**${date_formated}**)`
                    },
                    {
                        name: `Mensagem do lembrete`,
                        value: `\`${reminder.message}\``
                    },
                    {
                        name: `Onde será notificado?`,
                        value: `No servidor **${channel?.guild?.name || 'não encontrado'}** (\`${channel?.guild?.id || 'não encontrado'}\`) no canal **${channel?.name || 'não encontrado'}** (\`${channel?.id || 'Não encontrado'}\`)`
                    }])

                let delete_button = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Danger)
                            .setCustomId(`r_reminder_${reminder.created_by}_${reminder.id}`)
                            .setEmoji("🗑")
                    )
                reminder_menu = await this.fillMenu(message)
                return menu_message.edit({
                    embeds: [reminder_embed],
                    components: [reminder_menu, delete_button],
                    ephemeral: true
                })
            })

            collector.on('end', async () => {
                await menu_message.delete()
            })
        } else {
            let filter = (collector) => message.author.id == collector.author.id
            let bot_message = await message.reply({ content: `⏰ ${message.author.toString()}, quando eu devo te avisar?` })
            let collector = bot_message.channel.createMessageCollector({ filter: filter, time: 15000, max: 1 })

            collector.on('collect', async (msg) => {
                reminder_name = reminder_name.replace(/@/g, "@\u200b").slice(0, 1900)
                let time = this.client.utils.convertArgsToTime(msg.content)

                if (!time) return msg.reply({ content: `❌ ${message.author.toString()}, você precisa me falar um tempo válido para o lembrete!` })
                if (time > 315576000000) return msg.reply({ content: `❌ ${message.author.toString()}, você precisa me falar um tempo menor que 10 anos para o lembrete!` })
                if (time < 10_000) return msg.reply({ content: `❌ ${message.author.toString()}, você precisa me falar um tempo maior que 10 segundos para o lembrete!` })

                let date = new Date(Date.now() + time).toLocaleString('pt-br')
                await this.client.psql.createReminder(msg, time, reminder_name)

                message.reply({
                    content: `✅ ${message.author.toString()}, o lembrete \`${reminder_name}\` foi ativado e definido para **${date} (${this.client.utils.formatTime(Date.now() + time)})**!`
                })
            })

            collector.on('end', async () => {
                await bot_message.delete()
            })

        }
    }

    async fillMenu(message) {
        let menu_fields = []
        let reminders = await this.client.psql.getAllReminders(message.author.id)

        if (reminders.length == 0) return null

        reminders.map((user_reminder, counter) => {
            menu_fields.push({
                label: `Lembrete número ${counter + 1}`,
                description: (user_reminder.message),
                value: user_reminder.id.toString(),
            })
        })

        let reminder_menu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("menu")
                    .setPlaceholder(`Escolha o lembrete para ver suas informações!`)
                    .addOptions(menu_fields)
            )

        return reminder_menu
    }
}