import Command from "../../Structures/command.js"

export default class ChooseCommand extends Command {
    constructor(client) {
        super(client, {
            name: "escolher",
            description: "Me faça escolher alguma coisa dentre as opções que você me der!",
            aliases: ['choose', 'pick', 'select'],
            usage: '<argumento>, <argumento, [argumentos]...'
        })
    }

    async run(message, args, t) {
        let arg = args.join('').split(',')
        let choices = arg.filter(x => x.length > 0)

        if (choices.length <= 1) return message.reply({
            content: `❌ ${message.author.toString()}, dê-me no mínimo 2 opções para que eu possa fazer uma escolha dentre elas!`
        })

        let choice = choices[Math.floor(Math.random() * choices.length)]

        message.reply({
            content: `✅ ${message.author.toString()}, dentre as **${choices.length} opções** que você me deu, eu escolhi a opção \`${choice.replaceAll('`', '')}\`!`
        })
    }
}