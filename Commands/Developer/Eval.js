import Command from "../../Structures/command.js"

import { EmbedBuilder } from "discord.js"
import { inspect } from "util"
import { Sequelize } from "sequelize"
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

export default class EvalCommand extends Command {
    constructor(client) {
        super(client, {
            name: "eval",
            description: "Comando restrito!",
            aliases: ['ev', 'e'],
            owner: true
        })
    }

    async run(message, args) {
        let code = args.join(" ")
        let date = Date.now()

        if (!code) return message.reply({
            content: `❌ ${message.author.toString()}, você precisa especificar um código para executar!`
        })

        let res;
        try {
            res = await eval(code)
            if (typeof res !== "string") res = await inspect(res)
        } catch (e) {
            res = e.message
        }

        const embed = new EmbedBuilder()

            .setDescription(`\`\`\`js\n${res.slice(0, 4000)}\n\`\`\``)
            .setFooter({ text: `Tempo de execução: ${(Date.now() - date).toString()}ms` })

        message.reply({
            embeds: [embed]
        })

    }
}