import Command from "../../Structures/command.js"

export default class AddMoneyCommand extends Command {
    constructor(client) {
        super(client, {
            name: "addmoney",
            description: "Comando restrito!",
            aliases: ['am', 'add'],
            owner: false
        })
    }

    async run(message, args, t) {
        let user = await this.client.utils.findUser(args[0], this.client, message, true)
        let amount = this.client.utils.formatNumber(args[1])

        if (!Object.values(this.client.config.permissions).includes(message.author.id) && !process.env.OWNER_ID.includes(message.author.id)) return;

        if (!user) return message.reply({
            content: `❌ ${message.author.toString()}, você precisa especificar um usuário válido para efetuar esse pagamento!`
        })

        if (!amount || isNaN(amount) || amount === 0 || amount > 100_000_000_000) return message.reply({
            content: `❌ ${message.author.toString()}, você precisa especificar um valor válido para efetuar esse pagamento!`
        })

        await this.client.logger.payment({
            user: {
                id: user.id,
                tag: user.tag,
                avatar: user.displayAvatarURL()
            },
            author: {
                id: message.author.id,
                tag: message.author.tag,
            },
            amount: BigInt(amount),
            type: 'payment'
        })
        await this.client.psql.updateUserMoney(user.id, amount)
        await this.client.psql.createTransaction({
            source: 1,
            received_by: user.id,
            received_by_tag: user.tag,
            given_at: Date.now(),
            amount: amount
        })

        await message.react('✅')
    }
}