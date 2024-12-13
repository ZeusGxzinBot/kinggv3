import Event from "../Structures/event.js"

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, EmbedBuilder } from "discord.js";
import { fn, col } from "sequelize"
import ms from "ms"

import moment from "moment"

moment.locale('pt-br')

export default class MessageCreateListener extends Event {
    constructor(client) {
        super(client, "messageCreate")
    }

    async run(message) {
        if (!message.guild || message.bot) return;
        // this.guildBoostReward(message)
        // if (!process.env.OWNER_ID.includes(message.author.id)) return;

        let user = await this.client.psql.getUser(message.author.id),
            guild = await this.client.psql.getGuild(message.guild.id)

        let prefix = guild.prefix

        await this.checkAFK(user, message)

        if (message.content.match(this.checkMention(this.client.user.id))) return message.reply({
            content: `👋 Olá, eu sou o **${this.client.user.username}**! Para utilizar meus comandos use o prefixo \`${guild.prefix}\`, para mais informações, utilize o comando \`${guild.prefix}ajuda\`!`,

        })
        if (!message.content.toLowerCase().startsWith(prefix)) return;

        const args = message.content.slice(prefix.toLowerCase().length).trim().split(/ +/g), cmd = args.shift().toLowerCase()
        let command = this.client.commands.get(cmd) || this.client.commands.get(this.client.aliases.get(cmd))

        if (!command) return;
        if (command.owner && !process.env.OWNER_ID.includes(message.author.id)) return

        if (command.userPremium && Number(user.premium) > Date.now()) return message.reply({
            content: `⭐ ${message.author.toString()}, você não tem permissão para utilizar esse comando, ele é um comando exclusivo para **usuários VIP**!`
        })

        if (command.guildPremium && Number(guild.premium) > Date.now()) return message.reply({
            content: `⭐ ${message.author.toString()}, você não tem permissão para utilizar esse comando, ele é um comando exclusivo para **servidores VIP**!`
        })

        if (command.beta) return message.reply({
            content: `💻 ${message.author.toString()}, você não tem permissão para utilizar esse comando, ele é um comando exclusivo para **usuários BETA**!`
        })

        if (user.ban && message.author.id !== '799086286693597206') return message.reply({
            content: `${message.author.toString()}, você está banido(a) de usar meus comandos! Que pena que você não seguiu meus termos...\n>>> ❔ **Razão**: \`${user.ban_reason}\`\n🗓️ **Data**: ${moment(Number(user.ban_date)).format('LLLL')} \`(${this.client.utils.formatTime(Number(user.ban_date), 2)})\`\n👮 **Punido por**: ${user.ban_by_tag} \`(${user.ban_by})\``,
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

        let command_cooldown = await this.userCommandsCooldown(message);
        if (command_cooldown) return message.reply({
            content: command_cooldown
        })

        if (!message.member.permissions.has("ManageGuild", true)) {
            let checkRole = guild.allowed_roles.some(role => message.member.roles.cache.map(i => i.id).includes(role))
            if (!guild.allowed_channels.includes(message.channel.id) && !checkRole && guild.allowed_channels.length > 0) {
                return message.reply({
                    content: guild.warn_message.replace('{{author}}', message.author.toString())
                })
            }
        }

        await this.client.psql.commands.create({
            author: message.author.id,
            date: Date.now(),
            content: message.content,
            name: command.name,
            message: message.id,
            channel: message.channel.id,
            guild: message.guild.id,
            aliases: command.aliases
        })

        await command.run(message, args, { userData: user, guildData: guild, userPremium: Number(user.premium) > Date.now(), guildPremium: Number(user.guild) > Date.now() })
    }

    async userCommandsCooldown(message) {
        let cooldown = this.client.cooldowns.get(message.author.id)
        let user = await this.client.psql.getUser(message.author.id)

        if (user.ban) return;
        if (Object.values(this.client.config.permissions).includes(message.author.id) || process.env.OWNER_ID.includes(message.author.id)) return;

        if (cooldown?.time >= Date.now()) {
            this.client.cooldowns.set(message.author.id, {
                warns: cooldown?.warns ? cooldown?.warns + 1 : 1,
                time: cooldown?.warns > 0 ? cooldown?.time + 5_000 : cooldown?.time
            })

            if (cooldown?.warns >= 5) {
                await this.client.psql.users.update({
                    ban: true,
                    ban_date: Date.now(),
                    ban_reason: `[SISTEMA] Banido por enviar comandos rápido demais em um curto período de tempo. Se você tivesse dado ouvido meus avisos, talvez não estivesse banido! (você poderá pedir a remoção da punição 12 horas após o banimento, em meu servidor de suporte)`,
                    ban_by: this.client.user.id,
                    ban_by_tag: this.client.user.tag
                }, { where: { id: message.author.id } })

                this.client.cooldowns.set(message.author.id, { warns: 0, time: Date.now() })
            } else {
                return `⏰ ${message.author.toString()}, aguarde ${this.client.utils.formatTime(cooldown?.time, 2)} antes de usar outro comando. \`(AVISO: ${cooldown?.warns + 1}/5)\``
            }
        } else if (Math.floor(Math.random() * 100) < 65) this.client.cooldowns.set(message.author.id, { warns: 0, time: Date.now() + 4_000 })

        return false;
    }

    // async guildBoostReward(message) {
    //     let payment = 4_000_000
    //     if ('905867817600049173' == message.guild.id && '1040429339457626143' == message.channel.id) {
    //         if ([8, 9, 10, 11].includes(message.type)) {
    //             await this.client.psql.updateUserMoney(message.author.id, payment)
    //             await this.client.psql.updateUserPremium(message.author.id, ms('30d'))
    //             await this.client.psql.createTransaction({
    //                 source: 22,
    //                 received_by: message.author.id,
    //                 given_at: Date.now(),
    //                 amount: BigInt(payment)
    //             })

    //             let emb = new EmbedBuilder()
    //                 .setTitle(`**Membro booster!**`)
    //                 .setDescription(`@**${message.author.username}** Você recebeu uma recompensa de **${payment.toLocaleString()} moedas** por adicionar seu impulso aqui!`)

    //                 .setColor('#eb64e8')
    //                 .setTimestamp()
    //                 .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))

    //             message.channel.send({
    //                 content: message.author.toString(),
    //                 embeds: [emb]
    //             })
    //         }
    //     }
    // }

    async checkAFK(user, message) {
        if (user.is_afk) {
            if (user.afk_local == message.guild.id || user.afk_local == null) {
                let time_afk = this.client.utils.formatTime(parseInt(user.afk_time), 2)
                let afk_msg = `👋 Bem-vindo de volta ${message.author.toString()}! Você ficou AFK por **${time_afk}**.`

                await this.client.psql.updateUser(message.author.id, {
                    is_afk: false,
                    afk_reason: "",
                    afk_ping: [],
                    afk_local: undefined
                })

                if (user.afk_ping.length > 0) {
                    let pings = user.afk_ping.map(x => `\`${x}\``).join(", ")
                    afk_msg += ` Você foi marcado por ${user.afk_ping.length} pessoas\n> Sendo elas: ${pings}.`
                }

                message.reply({
                    content: afk_msg
                })
            }
        }

        if (message.mentions.users.size > 0 && !message.author.bot) {
            for (let i = 0; i < message.mentions.users.size; i++) {
                let user_ping = message.mentions.users.map(x => x)[i]
                let user_data = await this.client.psql.users.findOne({
                    where: {
                        id: user_ping.id,
                        is_afk: true
                    },
                    raw: true
                })

                if (user_data != null) {
                    if (!user_data.afk_ping.includes(message.author.username)) {
                        user_data.afk_ping.push(message.author.username)
                        await this.client.psql.updateUser(user_data.id, {
                            afk_ping: user_data.afk_ping
                        })
                    }

                    message.reply({
                        content: `⏰ ${message.author.toString()}, o usuário \`${user_ping.tag}\` está **AFK** há **${this.client.utils.formatTime(parseInt(user_data.afk_time), 2)}**${user_data.afk_reason != '' ? `\n**Motivo:** \`${user_data.afk_reason}\`` : ''}`
                    })
                }
            }
        }
    }

    checkMention(id) {
        return new RegExp(`^<@!?${id}>( |)$`)
    }
}
