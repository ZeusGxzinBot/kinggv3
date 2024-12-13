import Command from "../../Structures/command.js"

import { PermissionsBitField } from "discord.js"

export default class AboutmeCommand extends Command {
    constructor(client) {
        super(client, {
            name: "sobremim",
            description: "Troque a descrição do seu perfil social!",
            aliases: ['aboutme'],
            usage: '<descrição>'
        })
    }

    async run(message, args) {
        let about = args.slice(0).join(' ')

        if (!about || about.length > 200) return message.reply({
            content: `❌ ${message.author.toString()}, você precisa me falar uma descrição válida de no máximo 200 caractéres para defini-lo no seu perfil!`
        })

        await this.client.psql.updateSocial(message.author.id, { about: about })

        message.reply({
            content: `✅ ${message.author.toString()}, a descrição do seu perfil foi alterada com sucesso!!\n> Nova descrição: **${about}**`
        })
    }
}