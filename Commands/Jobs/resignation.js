import Command from "../../Structures/command.js"

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"

export default class JobsCommand extends Command {
    constructor(client) {
        super(client, {
            name: "demissão",
            description: "Peça demissão do seu atual emprego!",
            aliases: ['demissao', 'resignation']
        })
    }

    async run(message, args) {
        let worker = await this.client.psql.getWorker(message.author.id)
        let cooldowns = await this.client.psql.getCooldowns(message.author.id)

        if (worker.job == null) return message.reply({
            content: `❌ ${message.author.toString()}, você não tem nenhum emprego, é impossível se demitir!`
        })

        if (Number(cooldowns.work) > Date.now()) return message.reply({
            content: `❌ ${message.author.toString()}, para se demitir você não pode estar em tempo de espera!`
        })

        let button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Pedir demissão')
                    .setCustomId(`resignation`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('💼')
                    .setDisabled(false)
            )

        let bot_message = await message.reply({
            content: `❓ ${message.author.toString()}, você tem certeza que deseja pedir demissão? Você perderá todo o seu progresso no emprego atual!`,
            components: [button]
        })

        let filter = interaction => interaction.user.id == message.author.id;
        let collector = bot_message.createMessageComponentCollector({
            filter,
            time: 60_000
        })

        collector.on('collect', async (i) => {
            await i.deferUpdate().catch((e) => { null })
            let worker = await this.client.psql.getWorker(message.author.id)

            if (worker.job == null) return;

            await this.client.psql.updateWorker(message.author.id, {
                job: null,
                join_date: null,
                salary: 0,
                exp: 0,
                level: 0,
                req: 100,
                worked: 0
            })

            await bot_message.edit({
                content: `✅ ${message.author.toString()}, você pediu a demissão do seu emprego atual, todo o seu progresso foi perdido!`,
                components: []
            })
        })
    }
}