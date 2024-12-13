import Command from "../../Structures/command.js"

import { EmbedBuilder, parseEmoji } from "discord.js"

export default class EmojiCommand extends Command {
    constructor(client) {
        super(client, {
            name: "emoji",
            description: "Edite seu emoji de apostas!",
            aliases: ['betemoji', 'emojiapostas', 'emojiedit'],
            usage: '<emoji>'
        })
    }

    async run(message, args) {
        let is_premium = await this.client.psql.getUserPremium(message.author.id)
        let prefix = await this.client.psql.getGuildPrefix(message.guild.id)

        if (!is_premium) return message.reply({
            content: `❌ ${message.author.toString()}, você precisa ser um usuário VIP para usar esse comando.`,
        })

        if (!args[0]) return message.reply({
            content: `❓ ${message.author.toString()}, esse comando troca os emojis padrões do \`${prefix}corrida\` e do \`${prefix}apostar\` por emojis personalizados. Você pode escolher o emoji que deseja definir utilizando o comando \`${prefix}emoji <emoji>\`.`,
        })

        let emoji = this.client.emojis.cache.find(e => e.name == args[0] || e.id == args[0])

        if (!emoji) emoji = parseEmoji(args[0])

        let customEmoji = `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`

        if (!emoji.id || emoji.id == undefined) return message.reply({
            content: `❌ ${message.author.toString()}, não consegui encontrar esse emoji ou ele não é um emoji válido.`,
        })

        this.client.psql.updateUser(message.author.id, {
            bet_emoji: customEmoji
        })

        return message.reply({
            content: `✅ ${message.author.toString()}, seu emoji personalizado para as corridas e apostas agora está definido como: ${customEmoji}!`,
        })
    }
}