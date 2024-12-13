import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js"

export default {
    name: 'about_',
    execute: async (client, interaction) => {
        let id = interaction.customId.split("_")[1]

        await interaction.deferUpdate().catch(() => null)

        let fields = interaction.fields
        let user = await interaction.client.users.fetch(id)

        let newdesc = fields.getTextInputValue(`aboutme_${user.id}`)

        await client.psql.updateSocial(user.id, { about: newdesc })
        return interaction.followUp({
            content: `✅ ${interaction.user.toString()}, a descrição do seu perfil foi alterada com sucesso!\n> Nova descrição: **${newdesc}**`,
            ephemeral: true
        })
    }
}