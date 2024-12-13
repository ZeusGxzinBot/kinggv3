import Command from "../../Structures/command.js"

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"

export default class BannerCommand extends Command {
  constructor(client) {
    super(client, {
      name: "banner",
      description: "Veja a faixa de algum usuário ou a sua própria!",
      aliases: ['bn'],
      usage: '[usuário]'
    })
  }

  async run(message, args) {
    let user = await this.client.utils.findUser(args[0], this.client, message, true)
    let banner = await this.client.users.fetch(user.id, { force: true }).then(x => x.bannerURL({ dynamic: true, size: 4096 }))

    if (!banner) return message.reply({
      content: `❌ ${message.author.toString()}, esse perfil não tem nenhuma faixa definida!`
    })

    let embed = new EmbedBuilder()

      .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })
      .setColor(this.client.config.colors.default)
      .setTimestamp()

      .setImage(banner)

    let row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setURL(banner)
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
