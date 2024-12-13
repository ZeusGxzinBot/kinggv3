import Command from "../../Structures/command.js"

export default class SayCommand extends Command {
    constructor(client) {
        super(client, {
            name: "falar",
            description: "Me faça repetir o que você disse!",
            aliases: ['repetir', 'say', 'saysomething', 'repeat'],
            usage: '<frase>'
        })
    }

    async run(message, args) {
        let response = args.join(' ')

        if (!response) return message.reply({
            content: `❌ ${message.author.toString()}, diga-me algo para que eu possa repetir!`
        })

        message.reply({
            content: response.replace(/@/g, "@\u200b").slice(0, 1900) + `\n\n🦜 Mensagem enviada por: **@${message.author.username}** \`(${message.author.id})\``
        })
    }
}