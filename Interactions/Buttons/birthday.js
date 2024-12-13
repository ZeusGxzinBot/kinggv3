import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionsBitField } from "discord.js"

export default {
    name: 'profile_bday_',
    execute: async (client, interaction) => {
        let split = interaction.customId.split("_")
        if (split[2] != interaction.user.id) return;

        interaction.showModal(
            new ModalBuilder()
                .setCustomId(`birthday_set_${interaction.user.id}`)
                .setTitle(`Aniversário`)
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('bday')
                            .setLabel(`Qual a data do seu aniversário?`)
                            .setPlaceholder(`Exemplo: 3/3. (Isso não pode ser alterado após definido!)`)
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(5)
                            .setMinLength(3)
                            .setRequired(true)
                    )
                )
        )
    }
} 