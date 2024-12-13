import { EmbedBuilder, PermissionsBitField } from "discord.js"

export default {
    name: 'config_message_modal_',
    execute: async (client, interaction) => {
        await interaction.deferUpdate().catch(e => null)
        let message = interaction.fields.getTextInputValue("message")

        if (interaction.customId.split('_')[2] !== interaction.user.id) return;
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

        await client.psql.updateGuild(interaction.guild.id, { warn_message: message.slice(0, 200) })

        return interaction.followUp({
            content: `✅ ${interaction.user.toString()}, a mensagem de aviso ao usar comandos em canais não permitidos foi definida como \`${message.slice(0, 200)}\`!`,
            ephemeral: true
        })
    }
}