import Command from "../../Structures/command.js"

export default class UnbanCommand extends Command {
    constructor(client) {
        super(client, {
            name: "desbanimento",
            description: "Comando restrito!",
            aliases: ['unban'],
            owner: false
        })
    }

    async run(message, args) {
        let user = await this.client.utils.findUser(args[0], this.client, message, true)

        if (!Object.values(this.client.config.permissions).includes(message.author.id) && !process.env.OWNER_ID.includes(message.author.id)) return;
        if (!user || user.id === message.author.id || Object.values(this.client.config.permissions).includes(user.id) || process.env.OWNER_ID.includes(user.id)) return message.reply({
            content: t('errors:dev_ban:no_user', { mention: message.author.toString() })
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
            type: 'unban'
        })
        await this.client.psql.users.update({
            ban: false
        }, { where: { id: user.id } })

        await message.react('✅')
    }
}
