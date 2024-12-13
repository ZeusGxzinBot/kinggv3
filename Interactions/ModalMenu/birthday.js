import { AttachmentBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js"

export default {
    name: 'birthday_set_',
    execute: async (client, interaction) => {
        await interaction.deferUpdate().catch(e => null)
        let date = interaction.fields.getTextInputValue("bday")

        if (interaction.customId.split('_')[2] !== interaction.user.id) return;
        if (!client.utils.validateDate(date)) return interaction.followUp({
            content: `❌ ${interaction.user.toString()}, essa não é uma data válida!`,
            ephemeral: true
        })

        let split = date.split('/')

        await client.psql.updateUser(interaction.user.id, { birthday: `${Number(split[0])}/${Number(split[1])}` })

        let profile = await client.psql.getProfile(interaction.user.id)

        await interaction.message.edit({
            components: [new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Secondary)
                        .setLabel('Reputação')
                        .setCustomId(`profile_rep_${interaction.user.id}`),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Secondary)
                        .setLabel('Sobre mim')
                        .setCustomId(`profile_about_${interaction.user.id}`),
                    new ButtonBuilder()
                        .setDisabled(true)
                        .setStyle(ButtonStyle.Secondary)
                        .setLabel(profile.birthday)
                        .setEmoji("🍰")
                        .setCustomId(`profile_bday_${interaction.user.id}`)
                )
            ]
        })

        return interaction.followUp({
            content: `🍰 ${interaction.user.toString()}, a sua data de aniversário foi definida para \`${Number(split[0])}/${Number(split[1])}\`!`,
            ephemeral: true
        })
    }
}