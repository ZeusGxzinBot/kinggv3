import Command from "../../Structures/command.js"
import { EmbedBuilder } from "discord.js"

export default class TasksCommand extends Command {
    constructor(client) {
        super(client, {
            name: "tasks",
            description: "Complete as tarefas para receber moedas!",
            aliases: ['tasks', 'tarefas', 'tk'],
            usage: null
        })
    }

    async run(message, args) {
        let tasks = await this.client.psql.getTasks(message.author.id)
        let client_tasks = await this.client.psql.getTasks(this.client.user.id)

        let msg_content = ''
        let task_obj = {
            'daily': tasks.daily == true ? `✅ Você coletou sua **recompensa diária**!` : `❌ Você precisa coletar sua **recompensa diária**!`,
            'vote': tasks.vote == true ? `✅ Você **votou** no [Kingg](https://top.gg/bot/816841271964467241)!` : `❌ Você precisa **votar** no [Kingg](https://top.gg/bot/816841271964467241)!`,
            'work': tasks.work >= client_tasks.work ? `✅ Você trabalhou **${tasks.work}** vezes!` : `❌ Você precisa trabalhar **${client_tasks.work - tasks.work}** vezes!`,
            'crime': tasks.crime >= client_tasks.crime ? `✅ Você cometeu **${tasks.crime}** crimes!` : `❌ Você precisa cometer **${client_tasks.crime - tasks.crime}** crimes!`,
            'reps': tasks.reps >= client_tasks.reps ? `✅ Você enviou **${tasks.work}** reputações!` : `❌ Você precisa enviar **${client_tasks.reps - tasks.reps}** reputações!`,
            'bets': tasks.bets >= client_tasks.bets ? `✅ Você apostou **${tasks.bets}** vezes!` : `❌ Você precisa apostar **${client_tasks.bets - tasks.bets}** vezes!`,
            'raffle': tasks.raffle >= client_tasks.raffle ? `✅ Você comprou **${tasks.work}** bilhetes da rifa!` : `❌ Você precisa comprar **${client_tasks.raffle - tasks.raffle}** bilhetes da rifa!`,
        }

        for (let data in task_obj) {
            msg_content += `> ${task_obj[data]}\n`
        }

        if (!msg_content.includes('❌') && tasks.completed == false) {
            await this.client.psql.updateTasks(message.author.id, {
                completed: true
            })
            await this.client.psql.updateUserMoney(message.author.id, 1_000_000)
            await this.client.psql.createTransaction({
                source: 14,
                received_by: message.author.id,
                given_at: Date.now(),
                amount: BigInt(1000000)
            })

            msg_content += `\n🎉 Você completou suas tarefas diárias e recebeu **1.000.000** moedas!`
        }

        msg_content += `\n⏰ As tarefas diárias são resetadas todos os dias às **00:00**!\nRecompensa de **1,000,000** moedas ao completar todas as tarefas!`

        let total_completed = await this.client.psql.tasks.count({
            where: {
                completed: true
            }
        })

        let embed = new EmbedBuilder()

            .setFooter({ text: '@' + message.author.username + ` - ${total_completed} completaram as tarefas hoje!`, iconURL: message.author.displayAvatarURL() })
            .setColor(this.client.config.colors.default)
            .setTimestamp()

            .setTitle(`Tarefas de \`${'@' + message.author.username}\``)
            .setDescription(msg_content)

        message.reply({
            content: message.author.toString(),
            embeds: [embed]
        })
    }
}