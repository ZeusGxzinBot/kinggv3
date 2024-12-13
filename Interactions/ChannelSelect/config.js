import { PermissionsBitField } from "discord.js"


export default {
    name: 'config_channels_',
    execute: async (client, interaction) => {
        await interaction.deferUpdate().catch(e => null)

        if (interaction.customId.split('_')[2] !== interaction.user.id) return;
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

        await client.psql.updateGuild(interaction.guild.id, { allowed_channels: interaction.values.slice(0, 25) })

        return interaction.followUp({
            content: `✅ ${interaction.user.toString()}, os canais permitidos foram alterados! Agora meus comandos estão permitidos para todos os usuários nos seguintes canais: ${interaction.values.map(channel => `<#${channel}>`)}!`,
            ephemeral: true
        })
    }
}