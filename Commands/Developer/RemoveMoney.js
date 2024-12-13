import Command from "../../Structures/command.js"


export default class RemoveMoneyCommand extends Command {
    constructor(client) {
        super(client, {
            name: "removemoney",
            description: "Comando restrito!",
            aliases: ['rm', 'remove'],
            owner: false
        })
    }

    async run(message, args) {
        let user = await this.client.utils.findUser(args[0], this.client, message, true)
        let amount = this.client.utils.formatNumber(args[1])

        if (!Object.values(this.client.config.permissions).includes(message.author.id) && !process.env.OWNER_ID.includes(message.author.id)) return;

        if (!user) return message.reply({
            content: t('errors:dev_money:no_user', { mention: message.author.toString() })
        })

        if (!amount || isNaN(amount) || amount === 0 || amount > 100_000_000_000) return message.reply({
            content: t('errors:dev_money:no_amount', { mention: message.author.toString() })
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
            amount: amount,
            type: 'unpayment'
        })
        await this.client.psql.updateUserMoney(user.id, -amount)
        await this.client.psql.createTransaction({
            source: 2,
            received_by: user.id,
            received_by_tag: user.tag,
            given_at: Date.now(),
            amount: BigInt(amount)
        })

        await message.react('✅')
    }
}