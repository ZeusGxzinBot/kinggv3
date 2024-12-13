import Command from "../../Structures/command.js"

import { AttachmentBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js"
import { createCanvas, loadImage, registerFont } from "canvas"
import { fillTextWithTwemoji } from "node-canvas-with-twemoji-and-discord-emoji"
import { abbreviate } from "util-stunks"

registerFont('./Assets/Fonts/helvetica_bold.otf', { family: 'Bold' })
registerFont('./Assets/Fonts/helvetica_regular.otf', { family: 'Helvetica' })

import moment from "moment"

moment.locale('pt-br')

const layout = await loadImage("./Assets/Images/profile.png");

export default class ProfileCommand extends Command {
    constructor(client) {
        super(client, {
            name: "perfil",
            description: "Veja seu saldo atual ou o de outro usuário!",
            aliases: ['profile', 'userprofile', 'pr'],
            usage: '[usuário]'
        })
    }

    async run(message, args) {
        try {
            let user = await this.client.utils.findUser(args[0], this.client, message, true)
            let profile = await this.client.psql.getProfile(user.id)
            let cooldowns = await this.client.psql.getCooldowns(user.id)
            let client = this.client

            if (profile.ban) return message.reply({
                content: `${message.author.toString()}, ${user.toString()} está banido(a) de usar meus comandos! Que pena que você não seguiu meus termos...\n>>> ❔ **Razão**: \`${profile.ban_reason}\`\n🗓️ Data: ${moment(Number(profile.ban_date)).format('LLLL')} \`(${this.client.utils.formatTime(Number(profile.ban_date), 2)})\`\n👮 Punido por: ${profile.ban_by_tag} \`(${profile.ban_by})\``,
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setURL(this.client.config.links.official_guild)
                                .setStyle(ButtonStyle.Link)
                                .setLabel('Suporte')
                        )
                ]
            })

            let image = createCanvas(800, 500),
                ctx = image.getContext("2d"),
                badges = profile.badges,
                about = profile.about.toLowerCase(),
                marry = profile.wedding == true ? await this.client.users.fetch(profile.wedding_user) : null,
                background = null

            try {
                background = await loadImage(String(profile.background))
            } catch (e) {
                background = await loadImage('https://cdn.discordapp.com/attachments/1104547477635465326/1193394852541517884/fundo.png')
            }

            if (profile.wedding) badges.push('💍')
            if (Number(cooldowns.vote) > Date.now()) badges.push('✅')
            if (Number(profile.premium) > Date.now()) badges.push('👑')
            if (profile.birthday == `${new Date().getDate()}/${new Date().getMonth()}`) badges.push('🍰')

            badges = badges.join("")

            ctx.fillStyle = '#FFFFFF';

            class Profile {
                constructor(user) {
                    this.user = user;
                }

                async drawAvatar() {
                    let avatarCanvas = createCanvas(145, 145);
                    let avatarCtx = avatarCanvas.getContext("2d");
                    let userImage = await loadImage(this.user.displayAvatarURL({ size: 2048, extension: 'png' }).replace('.gif', '.png').replace('a_', ''));

                    avatarCtx.beginPath();
                    avatarCtx.arc(72.5, 72.5, 72.5, 0, Math.PI * 2, true);
                    avatarCtx.closePath();
                    avatarCtx.clip();
                    avatarCtx.drawImage(userImage, 0, 0, 145, 145);
                    ctx.drawImage(avatarCanvas, 53, 53);
                }

                async drawUsername() {
                    ctx.font = '25px Bold'
                    await fillTextWithTwemoji(ctx, this.user.username.length > 10 ? '@' + this.user.username.slice(0, 8) + '...' : '@' + this.user.username, 42, 240);
                }

                async drawMoney() {
                    ctx.font = '25px Bold'
                    ctx.fillText(Number(profile.money) < 10_000 ? Number(profile.money).toLocaleString() : `${abbreviate(Number(profile.money), { display: 2 })}`, 65, 303)
                }

                async drawReps() {
                    ctx.font = '25px Bold'
                    ctx.fillText(Number(profile.reps).toLocaleString(), 65, 355)
                }

                async drawMarry() {
                    ctx.font = '25px Bold'
                    ctx.fillText(profile.wedding == true ? marry.username.length > 10 ? '@' + marry.username.slice(0, 8) + '...' : '@' + marry.username : 'solteiro', 65, 404)
                }

                async drawPosition() {
                    let leaderboard = await client.psql.users.findAll({ order: [['money', 'DESC']], attributes: ['id', 'money'], raw: true })
                    let position = parseInt(leaderboard.findIndex(x => x.id === user.id) + 1)

                    ctx.font = '25px Bold'
                    ctx.fillText('#' + (position + 1).toLocaleString(), 65, 455)
                }

                async drawAbout() {
                    ctx.font = '15px Helvetica'
                    await fillTextWithTwemoji(ctx, about.match(/.{1,70}/g).join("\n"), 280, 410);
                }
                async drawBadges() {
                    ctx.font = '30px Helvetica'
                    await fillTextWithTwemoji(ctx, String(badges), 550, 387)
                }
            }

            ctx.drawImage(background, 0, 0, image.width, image.height)
            ctx.drawImage(layout, 0, 0);

            const pr = new Profile(user)

            await pr.drawAvatar();
            await pr.drawPosition();
            await pr.drawUsername();
            await pr.drawMoney();
            await pr.drawReps();
            await pr.drawMarry();
            await pr.drawBadges();
            await pr.drawAbout();

            let attach = new AttachmentBuilder(image.toBuffer(), 'profile.png')

            let row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Secondary)
                        .setLabel('Reputação')
                        .setCustomId(`profile_rep_${user.id}`)
                        .setEmoji('❤️‍🔥'),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Secondary)
                        .setLabel('Sobre mim')
                        .setCustomId(`profile_about_${user.id}`)
                        .setEmoji('💬'),
                    new ButtonBuilder()
                        .setDisabled(profile.birthday == null ? message.author.id === user.id ? false : true : true)
                        .setStyle(ButtonStyle.Secondary)
                        .setLabel(profile.birthday == null ? message.author.id === user.id ? 'Definir' : '??/??' : profile.birthday)
                        .setEmoji("🍰")
                        .setCustomId(`profile_bday_${user.id}`)
                )


            message.reply({
                files: [attach],
                content: message.author.toString(),
                components: [row]
            })
        } catch (e) {
            message.reply({
                content: `❌ ${message.author.toString()}, ocorreu um erro, tente novamente mais tarde!`
            })
            console.log(e)
        }
    }
}