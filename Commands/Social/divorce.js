import Command from "../../Structures/command.js"

import { EmbedBuilder } from "discord.js"

export default class DivorceCommand extends Command {
    constructor(client) {
        super(client, {
            name: "divorciar",
            description: "Dê um fim ao seu casamento!",
            aliases: ['divorce'],
            usage: null
        })
    }

    async run(message, args) {
        let author_data = await this.client.psql.getSocial(message.author.id)

        if (!author_data.wedding) return message.reply({
            content: `❌ ${message.author.toString()}, você não é casado com ninguém.`
        })

        let user = await this.client.utils.findUser(author_data.wedding_user, this.client, message, false)
        let user_data = await this.client.psql.getSocial(user.id)

        let bot_message = await message.reply({
            content: `💍 ${message.author.toString()}, você tem certeza que deseja se divorciar de ${user.toString()}? Para aceitar clique \"✅\"!`
        })
        bot_message.react('✅')

        let filter = (reaction, user) => reaction.emoji.name === '✅' && [message.author.id].includes(user.id)
        let collector = bot_message.createReactionCollector({
            filter: filter,
            time: 120_000
        })

        collector.on('collect', async (r, u) => {
            let reactions = bot_message.reactions.cache.get("✅").users.cache.map(x => x.id)
            if (reactions.includes(message.author.id)) {
                collector.stop()

                let author_data_verify = await this.client.psql.getSocial(message.author.id)
                let user_data_verify = await this.client.psql.getSocial(user.id)

                if (!author_data_verify.wedding || !user_data_verify.wedding) return;

                await this.client.psql.social.update({
                    wedding: false
                }, {
                    where: {
                        id: user.id
                    }
                })
                await this.client.psql.social.update({
                    wedding: false
                }, {
                    where: {
                        id: message.author.id
                    }
                })

                bot_message.reply({
                    content: `💔 ${user.toString()} & ${message.author.toString()}, vocês estão divorciados...`
                })
            }
        })
    }
}

