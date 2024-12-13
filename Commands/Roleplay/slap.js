import Command from "../../Structures/command.js"

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, AttachmentBuilder } from "discord.js"

import axios from "axios"

export default class Slap extends Command {
    constructor(client) {
        super(client, {
            name: "tapa",
            description: "Envie um GIF para dar um tapa em um usuário!",
            aliases: ['slap', 'estapear'],
            usage: '<usuário>'
        })
    }

    async run(message, args) {
        let user = await this.client.utils.findUser(args[0], this.client, message, true)

        if (!user) return message.reply({
            content: `❌ ${message.author.toString()}, você precisa mencionar um usuário para fazer essa ação!`
        })

        if (user.id === message.author.id) return message.reply({
            content: `❌ ${message.author.toString()}, você não pode fazer essa ação com você mesmo!`
        })

        let image = await axios.get('https://api.otakugifs.xyz/gif?reaction=slap')

        let embed = new EmbedBuilder()

            .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })
            .setColor(this.client.config.colors.default)
            .setTimestamp()

            .setImage(image.data.url)
            .setDescription(`😠 ${message.author.toString()} deu um tapa ${user.toString()}!`)

        let row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Retribuir')
                    .setCustomId(`return`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔁')
                    .setDisabled(false)
            )

        let bot_message = await message.reply({
            content: message.author.toString(),
            embeds: [embed],
            components: [row]
        })

        let collector = bot_message?.createMessageComponentCollector({ time: 30000 })

        collector.on("collect", async (interaction) => {
            await interaction.deferUpdate().catch(() => { })

            if (interaction.user.id != user.id) return;

            image = await axios.get('https://api.otakugifs.xyz/gif?reaction=slap')
            embed = new EmbedBuilder()

                .setFooter({ text: '@' + user.username, iconURL: user.displayAvatarURL() })
                .setColor(this.client.config.colors.default)
                .setTimestamp()

                .setImage(image.data.url)
                .setDescription(`😠 ${user.toString()} retribuiu o tapa de ${message.author.toString()}!`)

            row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Retribuído')
                        .setCustomId(`return`)
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('🔁')
                        .setDisabled(true)
                )

            message.reply({
                content: user.toString(),
                embeds: [embed],
                components: [row]
            })
        })
    }
}