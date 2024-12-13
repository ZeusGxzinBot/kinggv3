import Command from "../../Structures/command.js"

import { EmbedBuilder } from "discord.js"

export default class BalanceCommand extends Command {
    constructor(client) {
        super(client, {
            name: "saldo",
            description: "Veja seu saldo atual ou o de outro usuário!",
            aliases: ['bal', 'balance', 'atm', 'carteira', 'moedas'],
            usage: '[usuário]'
        })
    }

    async run(message, args) {
        let user = await this.client.utils.findUser(args[0], this.client, message, true)
        let data = await this.client.psql.getUser(user.id)

        let leaderboard = await this.client.psql.users.findAll({ order: [['money', 'DESC']], attributes: ['id', 'money'], raw: true })
        let position = parseInt(leaderboard.findIndex(x => x.id === user.id) + 1)

        message.reply({
            content: `${message.author.toString()}, ${user.id == message.author.id ? `você` : user.toString()} tem **🪙 ${data.money.toLocaleString()}** moedas na carteira!\n🏆 ${user.id == message.author.id ? `A sua posição` : `A posição do usuário`} no placar dos mais ricos é **${'#' + position.toLocaleString()}**!`
        })
    }
}