import { PermissionsBitField } from "discord.js"

export default {
    name: 'config_roles_',
    execute: async (client, interaction) => {
        await interaction.deferUpdate().catch(e => null)

        if (interaction.customId.split('_')[2] !== interaction.user.id) return;
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

        await client.psql.updateGuild(interaction.guild.id, { allowed_roles: interaction.values.slice(0, 15) })

        return interaction.followUp({
            content: `✅ ${interaction.user.toString()}, os cargos permitidos foram alterados! Agora usuários com os seguintes cargos podem utilizar meus comandos em qualquer canal: ${interaction.values.map(role => `<@&${role}>`)}!`,
            ephemeral: true
        })
    }
}