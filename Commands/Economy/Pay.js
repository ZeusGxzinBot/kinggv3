import Command from "../../Structures/command.js"

import ms from "ms"

export default class PayCommand extends Command {
    constructor(client) {
        super(client, {
            name: "pagar",
            description: "Envie um pagamento a partir do seu saldo para um usuário!",
            aliases: ['pay', 'pagamento', 'pix'],
            usage: '<usuário> <valor>'
        })
    }

    async run(message, args) {
        let user = await this.client.utils.findUser(args[0], this.client, message, true)
        let data = await this.client.psql.getUser(message.author.id)
        let amount = this.client.utils.formatNumber(args[1], data.money)

        if (!user || user.id == message.author.id) return message.reply({
            content: `❌ ${message.author.toString()}, diga-me um usuário válido para enviar o pagamento!`
        })

        if (user.bot && user.id != this.client.user.id) return message.reply({
            content: `❌ ${message.author.toString()}, você não pode enviar pagamentos para aplicações!`
        })

        if (isNaN(amount) || amount < 10 || amount > 1_000_000_000) return message.reply({
            content: `❌ ${message.author.toString()}, diga-me um valor válido para enviar o pagamento!`
        })

        if (data.money < amount) return message.reply({
            content: `❌ ${message.author.toString()}, você não tem saldo suficiente para enviar esse pagamento!`
        })

        let cds = await this.client.psql.getCooldowns(message.author.id)
        let cds_user = await this.client.psql.getCooldowns(user.id)
        let finished = false

        if (Number(cds.daily) < Date.now()) return message.reply({
            content: `❌ ${message.author.toString()}, você precisa pegar sua recompensa diária para enviar pagamentos!`
        })

        if (Number(cds_user.daily) < Date.now()) return message.reply({
            content: `❌ ${message.author.toString()}, o usuário em questão precisa pegar sua recompensa diária para enviar pagamentos!`
        })

        const bot_message = await message.reply({
            content: `${user.toString()}, ${message.author.toString()} quer lhe enviar 🪙 **${amount.toLocaleString()} moedas** em um **pagamento**.\nPara aceitar os dois devem clicar em ✅. (Esse pagamento expira <t:${parseInt((Date.now() + ms('5m')) / 1000)}:R>)`
        })
        bot_message.react('✅')

        let filter = (reaction, user) => reaction.emoji.name === `✅` && [user.id, message.author.id].includes(user.id)
        let collector = bot_message.createReactionCollector({
            filter: filter,
            time: ms('5m')
        })

        collector.on('collect', async (r, i) => {
            let reactions = bot_message.reactions.cache.get('✅').users.cache.map(x => x.id)
            if (reactions.includes(user.id) && reactions.includes(message.author.id)) {
                if (finished) return;
                finished = true, collector.stop()

                let author_check = await this.client.psql.getUser(message.author.id)
                let user_check = await this.client.psql.getUser(user.id)

                if (author_check.money < amount || user_check.ban) return;

                await this.client.psql.updateUserMoney(message.author.id, -amount)
                await this.client.psql.updateUserMoney(user.id, amount)
                await this.client.psql.createTransaction({
                    source: 7,
                    received_by: user.id,
                    given_by: message.author.id,
                    given_by_tag: message.author.tag,
                    received_by_tag: user.tag,
                    given_at: Date.now(),
                    amount: BigInt(amount)
                })

                await message.reply({
                    content: `✅ ${user.toString()}, você recebeu 🪙 **${amount.toLocaleString()} moedas** de ${message.author.toString()}!`
                })
            }
        })
    }
}