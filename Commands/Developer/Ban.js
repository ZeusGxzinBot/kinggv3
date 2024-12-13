import Command from "../../Structures/command.js"

export default class BanCommand extends Command {
    constructor(client) {
        super(client, {
            name: "banimento",
            description: "Comando restrito!",
            aliases: ['ban'],
            owner: false
        })
    }

    async run(message, args) {
        let user = await this.client.utils.findUser(args[0], this.client, message, true)
        let reason = args.slice(1)?.join(' ') || 'Nenhuma razão foi específicada... entre em contato com nossa equipe para saber mais sobre seu banimento!'

        if (!Object.values(this.client.config.permissions).includes(message.author.id) && !process.env.OWNER_ID.includes(message.author.id)) return;
        if (!user || user.id === message.author.id || process.env.OWNER_ID.includes(user.id)) return message.reply({
            content: `❌ ${message.author.toString()}, você precisa especificar um usuário válido para banir!`
        })

        await this.client.logger.ban({
            user: {
                id: user.id,
                tag: user.tag,
                avatar: user.displayAvatarURL()
            },
            author: {
                id: message.author.id,
                tag: message.author.tag,
            },
            reason: reason,
            type: 'ban'
        })
        await this.client.psql.users.update({
            ban: true,
            ban_date: Date.now(),
            ban_reason: reason,
            ban_by: message.author.id,
            ban_by_tag: message.author.tag
        }, { where: { id: user.id } })

        await message.react('✅')
    }
}