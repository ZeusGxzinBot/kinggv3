import Command from "../../Structures/command.js"

import { PermissionsBitField } from "discord.js"

export default class PayCommand extends Command {
    constructor(client) {
        super(client, {
            name: "prefixo",
            description: "Troque o prefixo da aplicação dentro do servidor!",
            aliases: ['prefix', 'trocarprefixo', 'changeprefix', 'guildprefix'],
            usage: '<prefixo>'
        })
    }

    async run(message, args) {
        let guild = await this.client.psql.getGuild(message.guild.id), prefix = args[0]

        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply({
            content: `❌ ${message.author.toString()}, você precisa ter a permissão de \`Administrador\` dentro desse servidor para alterar essa configuração!`
        })

        if (!prefix || prefix.length > 3) return message.reply({
            content: `❌ ${message.author.toString()}, você precisa me falar um prefixo válido de até 3 caractéres para defini-lo como padrão do servidor!`
        })

        if (guild.prefix.toLowerCase() === prefix.toLowerCase()) return message.reply({
            content: `❌ ${message.author.toString()}, esse prefixo é igual ao atual, diga-me um diferente!`
        })

        await this.client.psql.guilds.update({ prefix: prefix }, { where: { id: message.guild.id } })

        message.reply({
            content: `✅ ${message.author.toString()}, meu prefixo padrão neste servidor foi alterado com sucesso!\n> Novo prefixo: **${prefix}**`
        })
    }
}