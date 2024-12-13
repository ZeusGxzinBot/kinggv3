import Command from "../../Structures/command.js"

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"

import ms from "ms"

export default class ReputationCommand extends Command {
    constructor(client) {
        super(client, {
            name: "reputação",
            description: "Envie uma reputação para um usuário!",
            aliases: ['rep', 'reputation', 'userprofile'],
            usage: '<usuário> [mensagem]'
        })
    }

    async run(message, args) {
        let user = await this.client.utils.findUser(args[0], this.client, message, true)
        let cds = await this.client.psql.getCooldowns(message.author.id)

        if (Number(cds.rep) > Date.now()) return message.reply({
            content: `⏰ ${message.author.toString()}, espere \`${await this.client.utils.formatTime(Number(cds.rep), 2)}\` para poder utilizar esse comando novamente!`
        })

        if (!user || user.id == message.author.id) return message.reply({
            content: `❌ ${message.author.toString()}, diga-me um usuário válido para enviar essa reputação!`
        })

        let data = await this.client.psql.getProfile(user.id)
        let user_data = await this.client.psql.getProfile(message.author.id)
        let user_message = args.slice(1)?.join(' ')?.replaceAll(/ `#@/g, '')?.slice(0, 75) || null
        let reps = user_data.wedding_user === user.id ? 2 : 1

        let embed = new EmbedBuilder()

            .setColor(this.client.config.colors.pink)
            .setTimestamp()
            .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL() })

            .setTitle(`Reputação Enviada`)
            .setDescription(`${message.author.toString()} você enviou ${user_data.wedding_user === user.id ? 'duas reputações' : 'uma reputação'} para ${user.toString()} \`(${user.id})\`${user_message ? ` com a mensagem \`${user_message}\`.` : ','} agora esse usuário possui **${(data.reps + reps).toLocaleString()}** reputações.`)

        let row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Lembrar-me')
                    .setCustomId(`remind_${message.author.id}_${Date.now() + ms('1h')}_rep`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔔')
                    .setDisabled(false)
            )

        let tasks = await this.client.psql.getTasks(message.author.id)

        await this.client.psql.updateCooldowns(message.author.id, 'rep', ms('1h') + Date.now())
        await this.client.psql.updateSocialReps(user.id, reps)
        await this.client.psql.reputations.create({
            received_by: user.id,
            given_by: message.author.id,
            received_by_tag: user.tag,
            given_by_tag: message.author.tag,
            given_at: Date.now(),
            message: user_message
        })
        await this.client.psql.updateTasks(message.author.id, {
            reps: tasks.reps + 1
        })

        message.reply({
            content: message.author.toString(),
            embeds: [embed],
            components: [row]
        })
    }
}