import Command from "../../Structures/command.js"

import ms from "ms"

export default class AddVipCommand extends Command {
    constructor(client) {
        super(client, {
            name: "addvip",
            description: "Comando restrito!",
            aliases: ['adv'],
            owner: false
        })
    }

    async run(message, args) {
        let user = await this.client.utils.findUser(args[0], this.client, message)

        if (!Object.values(this.client.config.permissions).includes(message.author.id) && !process.env.OWNER_ID.includes(message.author.id)) return;

        if (!user) return message.reply({
            content: `❌ ${message.author.toString()}, você precisa especificar um usuário válido para adicionar tempo VIP!`
        })

        try { 
            await this.client.guilds.cache.get('930108325834686485').members.fetch(user.id).then(x => x.roles.add('1099162497124159648'))
        } catch (e) {
            console.log(e)
        }
        await this.client.psql.updateUserPremium(user.id, ms(args[1] || '30d'))
        await message.react('✅')
    }
}
