import Command from "../../Structures/command.js"

import { EmbedBuilder } from "discord.js"
import { Op } from "sequelize"

export default class MarryCommand extends Command {
    constructor(client) {
        super(client, {
            name: "casar",
            description: "Case com um usuário utilizando esse comando ou veja o informações sobre seu casamento, também é possível ver as pessoas casadas a mais tempo!",
            aliases: ['marry'],
            usage: '[usuário]'
        })
    }

    async run(message, args) {
        let user = await this.client.utils.findUser(args[0], this.client, message, true)
        let author_data = await this.client.psql.getSocial(message.author.id)

        if (author_data.wedding) {
            let muser = await this.client.users.fetch(author_data.wedding_user)
            let embed = new EmbedBuilder()

                .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })
                .setColor(this.client.config.colors.default)
                .setTimestamp()

                .setTitle('💍 Casamento')
                .setDescription('Você atualmente já está casado! Aqui estão algumas informações sobre seu casamento:')
                .setFields([
                    {
                        name: 'Casado com',
                        value: `\`@${muser.username}\` \`(${muser.id})\``,
                        inline: true
                    },
                    {
                        name: 'Casado há',
                        value: await this.client.utils.formatTime(Number(author_data.wedding_date), 2),
                        inline: true
                    }
                ])

            return message.reply({
                content: message.author.toString(),
                embeds: [embed]
            })

        } else {
            if (!user || user.id === message.author.id) return message.reply({
                content: `❌ ${message.author.toString()}, me diga um usuário válido com quem você deseja casar!`
            })

            const user_data = await this.client.psql.getSocial(user.id, true)

            if (author_data.wedding) return message.reply({
                content: `❌ ${message.author.toString()}, você já está casado com outro usuário atualmente!`
            })

            if (user_data.wedding) return message.reply({
                content: `❌ ${message.author.toString()}, esse usuário já está casado com outro usuário atualmente!`
            })

            let author_money = await this.client.psql.getUser(message.author.id, true)

            if (author_money.money < 50000) return message.reply({
                content: `❌ ${message.author.toString()}, você precisa de no mínimo 50.000 Magias para casar com alguém!`
            })

            let bot_message = await message.reply({
                content: `💍 ${user.toString()}, ${message.author.toString()} está lhe pedindo em casamento, para aceitar os dois devem clicar \"✅\"! Esse casamento irá lhe custar **50.000 Magias** ${message.author.toString()}.`
            })
            bot_message.react('✅')

            let filter = (r, u) => r.emoji.name === '✅' && [user.id, message.author.id].includes(u.id)
            let collector = bot_message.createReactionCollector({
                filter: filter,
                time: 120_000
            })

            collector.on('collect', async (r, u) => {
                let reactions = bot_message.reactions.cache.get('✅').users.cache.map(x => x.id)
                if (reactions.includes(user.id) && reactions.includes(message.author.id)) {
                    collector.stop()

                    const verfi_user = await this.client.psql.getUser(message.author.id, true)

                    if (verfi_user < 50000) return;

                    let verfi_author = await this.client.psql.getSocial(message.author.id, true)
                    let user_data = await this.client.psql.getSocial(user.id, true)

                    if (verfi_author.wedding || user_data.wedding) return;

                    await this.client.psql.updateUserMoney(message.author.id, -50000)
                    await this.client.psql.social.update({
                        wedding: true,
                        wedding_date: Date.now(),
                        wedding_user: message.author.id
                    }, {
                        where: {
                            id: user.id
                        }
                    }), await this.client.psql.social.update({
                        wedding: true,
                        wedding_date: Date.now(),
                        wedding_user: user.id
                    }, {
                        where: {
                            id: message.author.id
                        }
                    })

                    bot_message.reply({
                        content: `💘 ${user.toString()} & ${message.author.toString()}, vocês estão oficialmente casados, felicidades!`
                    })
                }
            })
        }
    }
}