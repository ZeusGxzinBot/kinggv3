import Command from "../../Structures/command.js"

import { AttachmentBuilder, EmbedBuilder } from "discord.js"
import { createCanvas, loadImage, registerFont } from "canvas"
import { fillTextWithTwemoji } from "node-canvas-with-twemoji-and-discord-emoji"

registerFont('./Assets/Fonts/helvetica_bold.otf', { family: 'Helvetica Bold' })
registerFont('./Assets/Fonts/helvetica_regular.otf', { family: 'Helvetica' })

export default class LeaderboardCommand extends Command {
    constructor(client) {
        super(client, {
            name: "placar",
            description: "Veja o placar dos 5 usuários com mais saldo!",
            aliases: ['lb', 'leaderboard', 'top', 'rank'],
            usage: '[página]'
        })
    }
    async run(message, args) {
        let type = ['reps', 'reputatios', 'reputações'].includes(args[0]) ? 'social' : 'users'
        try {
            let page = type === 'social' ? parseInt(args[1]) : parseInt(args[0])
            if (page)
                if (page > 5 || page < 1) page = 0
                else page = parseInt((page - 1) * 5)
            else page = 0
            if (isNaN(page)) page = 0

            const users_leaderboard = await this.client.psql[type].findAll({
                order: type == 'users' ? [['money', 'DESC']] : [['reps', 'DESC']],
                attributes: type == 'users' ? ['id', 'money'] : ['id', 'reps']
            }).then(x => x.map(y => y.dataValues).slice(page, page + 5))

            let image = createCanvas(500, 600), ctx = image.getContext("2d")

            for (let i = 0; i < users_leaderboard.length; i++) {
                let y = 97 * i, x = 135

                let user = await this.client.users.fetch(users_leaderboard[i].id), av = user.displayAvatarURL({ size: 2048, extension: 'png' })
                ctx.save()
                let avatar = await loadImage(av.replace('.gif', '.png').replace('a_', ''))
                ctx.drawImage(avatar, x - 95, y + 110, 90, 90);
                ctx.restore()
            }

            let layout = await loadImage(type == 'users' ? 'https://cdn.discordapp.com/attachments/1099162578522996766/1146595116396576788/1672327836395.png' : 'https://cdn.discordapp.com/attachments/1099162578522996766/1146595116614684763/1674317694268.png')
            ctx.drawImage(layout, 0, 0, image.width, image.height)

            for (let i = 0; i < users_leaderboard.length; i++) {
                let y = 97 * i, x = 155
                let user = await this.client.users.fetch(users_leaderboard[i].id)

                ctx.save()
                ctx.font = user.tag.length >= 15 ? '15px Helvetica' : '20px Helvetica';
                ctx.fillStyle = '#F8F8F8';
                ctx.fillText(user.tag, x, y + 142)

                ctx.font = '30px Helvetica';
                ctx.fillStyle = '#F8F8F8';
                ctx.fillText(`${i + (page + 1)}°`, x + 260, y + 120)

                ctx.font = '13px Helvetica';
                ctx.fillStyle = '#F8F8F8';
                ctx.fillText('ID: ' + user.id, x, y + 156)

                ctx.font = '25px Helvetica';
                ctx.fillStyle = '#F8F8F8';
                ctx.fillText(BigInt(users_leaderboard[i][type == 'users' ? 'money' : 'reps']).toLocaleString() + ` ${type == 'users' ? 'moedas' : 'reputações'}`, x, y + 182)
                ctx.restore()
            }

            let attach = new AttachmentBuilder(image.toBuffer(), 'leaderboard.png')

            message.reply({
                files: [attach],
                content: message.author.toString()
            })
        } catch (e) {
            message.reply({
                content: `❌ ${message.author.toString()}, ocorreu um erro, tente novamente mais tarde!`
            })
            console.log(e)
        }
    }
}