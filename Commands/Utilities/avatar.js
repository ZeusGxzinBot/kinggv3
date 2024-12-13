import Command from "../../Structures/command.js";
import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js"

export default class AvatarCommand extends Command {
  constructor(client) {
    super(client, {
      name: "avatar",
      description: "Veja o avatar de algum usuário ou o próprio!",
      aliases: ['av'],
      usage: '[usuário]'
    })
  }

  async run(message, args) {
    let user = await this.client.utils.findUser(args[0], this.client, message, true)

    let embed = new EmbedBuilder()

      .setTitle(`**${user.tag}**`)
      .setImage(user.displayAvatarURL({ dynamic: true, size: 2048 }))

      .setColor(this.client.config.colors.default)
      .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })
      .setTimestamp()

    let row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setURL(user.displayAvatarURL({ dynamic: true, size: 2048 }))
          .setDisabled(false)
          .setStyle(ButtonStyle.Link)
          .setEmoji('🔗')
          .setLabel('Link')
      )

    message?.reply({
      content: message.author.toString(),
      embeds: [embed],
      components: [row]
    })
  }
}
