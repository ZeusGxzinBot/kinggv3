import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"
import ms from "ms"

export default {
    name: 'remind',
    execute: async (client, interaction) => {
        await interaction.deferUpdate().catch(err => null)

        if (interaction.customId.split('_')[1] !== interaction.user.id) return;
        if (Number(interaction.customId.split('_')[2]) < Date.now()) return;

        let row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Lembrete ativo')
                    .setCustomId(`remind-allowed`)
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🔔')
                    .setDisabled(true)
            )

        await interaction.message?.edit({ components: [row] }).catch(() => { })

        let types = {
            daily: 'Você já pode coletar sua recompensa diaria novamente',
            weekly: 'Você já pode coletar sua recompensa semanal novamente',
            crime: 'Você já pode cometer um crime novamente',
            work: 'Você já pode trabalhar novamente',
            rep: 'Você já pode enviar uma reputação novamente',
            "vip-claim": 'Você já pode coletar sua recompensa VIP novamente!'
        }

        await client.psql.createReminder(interaction, Number(interaction.customId.split('_')[2]) - Date.now(), types[interaction.customId.split('_')[3]])

        interaction.followUp({
            content: `✅ ${interaction.user}, você definiu um lembrete para \`${client.utils.formatTime(Number(interaction.customId.split('_')[2]))}\` com a mensagem \`${types[interaction.customId.split('_')[3]]}\`!`,
            ephemeral: true
        })
    }
}