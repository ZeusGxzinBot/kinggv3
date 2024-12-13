import Command from "../../Structures/command.js";
import { evaluate } from "mathjs"

export default class CalcCommand extends Command {
  constructor(client) {
    super(client, {
      name: "calc",
      description: "Resolva problemas matemáticos com esse comando!",
      aliases: ['calcular'],
      usage: '<problema>'
    })
  }

  async run(message, args) {
    let question = args.join(" ")
    let response = await evaluate(question.replaceAll('x', '*').replaceAll('÷', '/').replaceAll('×', '*'))

    if (typeof Number(Math) != 'number') return message.reply({
      content: `❌ ${message.author.toString()}, diga-me um problema matemático válido para resolver!`
    })

    message?.reply({
      content: `${message.author}, \`${Number(response).toLocaleString()}\``
    })
  }
}
