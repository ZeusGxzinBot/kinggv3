import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js"

export default {
    name: 'profile_about_',
    execute: async (client, interaction) => {
        let id = interaction.customId.split("_")[2]

        if (id !== interaction.user.id) {
            await interaction.deferUpdate().catch(() => null)
            return;
        }

        const modal = new ModalBuilder()

            .setCustomId(`about_${interaction.user.id}`)
            .setTitle("Defina seu novo \"sobre mim\"!");

        const input = new TextInputBuilder()

            .setCustomId(`aboutme_${id}`)
            .setLabel("Qual será seu novo \"sobre mim\"?")
            .setPlaceholder("Exemplo: eu sou uma pessoa muito legal!")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(200)
            .setMinLength(2)

        const rowModal = new ActionRowBuilder().addComponents(input)
        modal.addComponents(rowModal)

        return interaction.showModal(modal)
    }
} 