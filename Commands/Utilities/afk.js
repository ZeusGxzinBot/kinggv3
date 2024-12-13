import Command from "../../Structures/command.js"

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"

export default class AfkCommand extends Command {
  constructor(client) {
    super(client, {
      name: "afk",
      description: "Ative o modo AFK e sempre que você for mencionado no servidor em que está ou de modo global o bot irá responder por você respondendo com a razão de você estar AFK.",
      aliases: ['awayfromkeyboard', 'modoafk'],
      usage: '<razão/motivo>'
    })
  }

  async run(message, args) {
    let reason = args.join(" "), local = undefined

    if (['local', 'servidor'].includes(args[0]?.toLowerCase())) {
      local = message.guild.id
      reason = args?.slice(1)?.join(" ")
    }

    await this.client.psql.updateUser(message.author.id, {
      is_afk: true,
      afk_time: Date.now(),
      afk_reason: reason,
      afk_ping: [],
      afk_local: local
    })

    message?.reply({
      content: local != undefined ? `✅ ${message.author.toString()}, **AFK local** ativado, assim que você mandar outra mensagem será desativado!` : `✅ ${message.author.toString()}, **AFK global** ativado, assim que você mandar outra mensagem será desativado!`
    })
  }
}
