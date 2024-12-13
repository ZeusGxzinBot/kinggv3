import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js"
import ms from "ms"

export default {
    name: 'updaterm_',
    execute: async (client, interaction) => {
        await interaction.deferUpdate().catch(() => null)

        let time = client.utils.convertArgsToTime(interaction.fields.getTextInputValue(`reminder_time`))

        if (!time) return interaction.followUp({ content: `❌ ${interaction.user.toString()}, você precisa me falar um tempo válido para o lembrete!`, ephemeral: true })
        if (time > 315576000000) return bot_message.reply({ content: `❌ ${interaction.user.toString()}, você precisa me falar um tempo menor que 10 anos para o lembrete!`, ephemeral: true })
        if (time < 10_000) return bot_message.reply({ content: `❌ ${interaction.user.toString()}, você precisa me falar um tempo maior que 10 segundos para o lembrete!`, ephemeral: true })

        await client.psql.reminders.update({ time: time, created_at: Date.now(), is_alerted: false }, { where: { id: interaction.customId.split("_")[2] } })

        let date = new Date(Date.now() + time).toLocaleString('pt-br')

        interaction.followUp({
            content: `✅ ${interaction.user.toString()}, prontinho! Vou te avisar novamente em **(${date})** (**${client.utils.formatTime(Date.now() + time)}**)`,
            ephemeral: true
        })
    }
}