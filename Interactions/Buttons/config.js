import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionsBitField } from "discord.js"

export default {
    name: 'config_message_',
    execute: async (client, interaction) => {
        if (interaction.customId.split('_')[2] !== interaction.user.id) return;
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

        interaction.showModal(
            new ModalBuilder()
                .setCustomId(`config_message_modal_${interaction.user.id}_`)
                .setTitle(`Mensagem de aviso`)
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('message')
                            .setLabel(`Qual a mensagem de aviso?`)
                            .setPlaceholder(`Exemplo: {{author}}, você não pode utilizar comandos nesse canal!`)
                            .setStyle(TextInputStyle.Paragraph)
                    )
                )
        )
    }
}