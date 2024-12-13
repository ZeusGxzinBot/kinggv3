import Command from "../../Structures/command.js"

export default class PingCommand extends Command {
    constructor(client) {
        super(client, {
            name: "ping",
            description: "Veja a velocidade de resposta da aplicação!",
            aliases: ['pong']
        })
    }

    async run(message, args) {
        let date = Date.now()

        await this.client.psql.users.findAll({ limit: 100 })

        return message.reply({
            content: `:ping_pong: ${message.author.toString()}, **pong**!\n- :small_orange_diamond: Shard: \`${message.guild.shardId} (TOTAL: ${this.client.shard.count})\`\n- :bookmark_tabs: Latência do Gateway: \`${this.client.ws.ping}ms\`\n- :computer: Latência da Database: \`${Date.now() - date}ms\``
        })
    }
}
