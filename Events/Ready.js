import Event from "../Structures/event.js"
import Chalk from "chalk";
import cron from "node-cron"
import ms from "ms"

import { Op, literal } from "sequelize"
import { ActivityType, EmbedBuilder, ModalBuilder, TextInputBuilder, ActionRowBuilder, ButtonStyle, TextInputStyle, ButtonBuilder } from "discord.js";

import { readFileSync, writeFileSync } from "fs"

export default class ReadyListener extends Event {
    constructor(client) {
        super(client, "ready")
    }

    async run() {
        console.log(Chalk.green('[KINGG] ') + this.client.user.tag + ' - Completamente funcional!')

        setInterval(async () => {
            this.client.user.setPresence({
                activities: [{ name: `em ${await this.client.shard.fetchClientValues('guilds.cache.size').then(gd => gd.reduce((acc, guildCount) => acc + guildCount, 0).toLocaleString())} servidores! 👑`, type: ActivityType.Playing }], status: 'online'
            })
        }, 15000)

        if (this.client.shard.ids[0] === 0) {
            await this.client.voter.initServer(3333)

            setInterval(async () => {
                await this.notifyReminder()
            }, 5_000)

            setInterval(async () => {
                await this.checkVotes()
                await this.checkVips()
            }, 15_000)

            cron.schedule("00 00 * * *", async () => {
                console.log(Chalk.green('[KINGG] - Taxa do daily & tarefas'))
                console.log(Chalk.green('[KINGG] - Mandando mensagens de aniversário'))

                let users = await this.client.psql.users.findAll({
                    where: {
                        money: {
                            [Op.lte]: 50000
                        }
                    },
                    include: [{
                        model: this.client.psql.social,
                        where: {
                            wedding: true
                        },
                        as: 'social'
                    }],
                    raw: true
                })

                await this.getBirthdays()
                // await this.weddingTax(users)
                await this.resetTasks(this)
                await this.dailyTax(this)
                await this.betTax(users)
            }, {
                timezone: "America/Sao_Paulo",
                scheduled: true
            })

            let raffle = await this.client.psql.getRaffleData(this.client.user.id)
            if (Number(raffle.ends_in) < Date.now()) await this.endRaffle()

            cron.schedule('0 * * * *', async () => {
                console.log(Chalk.green('[KINGG] - Apostas redefinidas'))
                await this.client.psql.users.update({ bets: 0 }, { where: { bets: { [Op.gte]: 1 } } })
            })

            cron.schedule('*/30 * * * *', async () => {
                console.log(Chalk.green('[KINGG] - Rifa encerrada'))
                await this.endRaffle()
            });
        }
    }

    async getBirthdays() {
        let users = await this.client.psql.users.findAll({
            where: { birthday: `${new Date().getDate()}/${new Date().getMonth() + 1}` },
            raw: true
        }) || []

        if (!users || users.length == 0) return;

        for (let i of users) {
            let user = await this.client.users.fetch(i.id)
            let data = await this.client.psql.getProfile(user.id)

            await this.client.psql.updateSocial(user.id, { reps: data.reps + 10 })

            user.send({
                content: `## :birthday: Parabéns! \nHoje é um dia especial, pois celebramos o dia em que você chegou a este mundo, iluminando a vida de todos ao seu redor com sua presença incrível! No seu aniversário, quero desejar a você todo o amor, felicidade e sucesso que o universo tem a oferecer. Que este ano seja repleto de momentos inesquecíveis, conquistas emocionantes e sorrisos que aquecem o coração.\n\n:cake: Que todos os seus sonhos se tornem realidade e que cada dia seja cheio de oportunidades emocionantes e aventuras emocionantes. Lembre-se sempre de que você é especial e merece todas as bênçãos que a vida tem a oferecer. Que a jornada da sua vida seja colorida com amor, amizade, saúde e prosperidade.\n\n:balloon: Neste dia especial, espero que você se cercado de amor e carinho, cercado por amigos e familiares que valorizam a pessoa incrível que você é. Que cada momento deste dia seja cheio de risos, abraços calorosos e momentos especiais compartilhados com aqueles que você ama.\n\n:sparkles: Que este novo ano de vida traga consigo novas oportunidades emocionantes, crescimento pessoal e muitos momentos de alegria. Que você continue a brilhar tão intensamente quanto uma estrela no céu noturno e que seu caminho seja iluminado pelas estrelas.\n\nE como hoje é o seu aniversário, vou lhe dar **10 reputações de presente** para deixar o seu dia mais feliz!\n\nQue este seja o melhor ano de todos e que cada dia seja tão especial quanto você é para todos nós!\n\nFeliz aniversário! :partying_face:`
            }).catch(e => { null })
        }
    }

    async endRaffle() {
        let data = await this.client.psql.getRaffleData(this.client.user.id)
        let [winner] = await this.client.psql.raffle_buyers.findAll({
            attributes: ['author'],
            order: literal('random()'),
            limit: 1,
            raw: true
        })

        if (!winner) {
            return await this.client.psql.raffle.update({ ends_in: Date.now() + ms('30m') }, { where: { id: this.client.user.id } });
        }
        let list_u = await this.client.psql.getRaffleUsers()

        let winnerInfo = await this.client.users.fetch(winner.author)
        let docInfo = await this.client.psql.getUser(winner.author)
        let winnerTickets = await this.client.psql.ticketCounter({ author: winner.author })
        let premium = await this.client.psql.getUserPremium(winner.author) || await this.client.psql.getUserPremium(winner.author)
        data.quantity = premium ? data.quantity : parseInt((data.quantity / 100) * 95)

        let totalTickets = await this.client.psql.ticketCounter()
        await this.client.logger.raffle({
            amount: data.quantity,
            winner: {
                id: winnerInfo.id,
                tag: winnerInfo.tag,
                avatar: winnerInfo.displayAvatarURL()
            },
            tickets: winnerTickets,
            tickets_total: totalTickets,
            users: data.participants,
            users_arr: list_u,
            percent: this.client.utils.calcPercentage(winnerTickets, totalTickets, 2)
        })

        await this.client.psql.resetRaffle(winnerInfo.id, data.quantity, this.client.user.id)
        await this.client.psql.transactions.create({
            source: 8,
            received_by: winner.author,
            given_at: Date.now(),
            amount: data.quantity
        })

        let embed = new EmbedBuilder()

            .setFooter({ text: winnerInfo.tag, iconURL: winnerInfo.displayAvatarURL() })
            .setColor(this.client.config.colors.default)
            .setTimestamp()

            .setTitle('Rifa')
            .setDescription(`${winnerInfo.toString()} Parabéns! Você ganhou a rifa, que sorte hein...! Abaixo estão algumas informações sobre sua vitória nessa rifa.`)

            .setFields([
                {
                    name: 'Bilhetes',
                    value: `Dos **${totalTickets.toLocaleString()}** bilhetes comprados, **${winnerTickets.toLocaleString()}** deles foram seus!`,
                    inline: true
                },
                {
                    name: 'Sorte',
                    value: `Você tinha **${this.client.utils.calcPercentage(winnerTickets, totalTickets, 2)}** de chances de ganhar essa rifa, e ganhou! Que sorte!`,
                    inline: true
                },
                {
                    name: 'Valor ganho',
                    value: `+ 🪙 **${data.quantity.toLocaleString()}** moedas`,
                    inline: false
                },
            ])

        winnerInfo.send({
            content: `<@${winner.author}>`,
            embeds: [embed]
        }).catch(e => { null })
    }

    async dailyTax() {
        console.log(Chalk.blue('[EVENT] ') + ' Iniciando taxação!')
        const inativeData = new Date(new Date().getTime() - (1 * 24 * 60 * 60 * 1000)).getTime();

        const all_users = await this.client.psql.cooldowns.findAll({
            where: {
                daily: {
                    [Op.or]: {
                        [Op.lte]: inativeData,
                        [Op.eq]: 0
                    }
                },
            },
            include: {
                model: this.client.psql.users, as: 'user',
                where: {
                    money: {
                        [Op.gte]: 1_000_000
                    }
                }
            },
            raw: true,
            order: [
                ['daily', 'DESC']
            ]
        })

        let text_logs = ""

        let dailyTaxes = [
            {
                moneyLimit: 1_000_000_000,
                cooldownLimit: 86400000, // 1 dia
                taxRate: 0.50
            },
            {
                moneyLimit: 500_000_000,
                cooldownLimit: 259200000, // 3 dias
                taxRate: 0.35
            },
            {
                moneyLimit: 100_000_000,
                cooldownLimit: 604800000, // 7 dias
                taxRate: 0.25
            },
            {
                moneyLimit: 1_000_000,
                cooldownLimit: 1296000000, // 15 dias
                taxRate: 0.10
            }
        ]

        for (let user of all_users) {
            let money = user["user.money"]
            let tax = 0
            let flag = false
            for (let i = 0; i < dailyTaxes.length; i++) {
                let {
                    moneyLimit,
                    cooldownLimit,
                    taxRate
                } = dailyTaxes[i]
                if (money > moneyLimit && (Date.now() - user.daily) >= cooldownLimit && !flag) {
                    let user_fetch = await this.client.users.fetch(user.id)
                    tax = parseInt(money * taxRate)
                    await this.client.psql.updateUser(user.id, {
                        money: money - tax
                    })
                    await this.client.psql.transactions.create({
                        source: 10,
                        given_by: user.id,
                        given_at: Date.now(),
                        amount: tax
                    })
                    text_logs += `${user_fetch.tag} (${user_fetch.id}), perdeu ${taxRate * 100}% de suas moedas! O usuário tinha **${money.toLocaleString()} moedas** e agora tem **${(money - tax).toLocaleString()}**!\n`
                    flag = true
                }
            }
        }

        this.client.logger.taxDaily(text_logs, 'DailyTax')
    }

    async checkVotes() {
        let users = await this.client.guilds.cache.get('930108325834686485').roles.cache.get('1156708763382857748').members.map(x => x.user)

        for (let user of users) {
            let data = await this.client.psql.getCooldowns(user.id)

            if (Number(data.vote) < Date.now())
                try { await this.client.guilds.cache.get('930108325834686485').members.fetch(user.id).then(x => x.roles.remove('1156708763382857748')) }
                catch (e) { console.log(e) }
        }
    }

    async checkVips() {
        let users = await this.client.guilds.cache.get('930108325834686485').roles.cache.get('1099162497124159648').members.map(x => x.user)

        for (let user of users) {
            let data = await this.client.psql.getUser(user.id)

            if (Number(data.premium) < Date.now())
                try { await this.client.guilds.cache.get('930108325834686485').members.fetch(user.id).then(x => x.roles.remove('1099162497124159648')) }
                catch (e) { console.log(e) }
        }
    }

    async notifyReminder() {
        const all_reminders = await this.client.psql.reminders.findAll({
            where: { is_alerted: false },
            raw: true
        }) || []

        if (!all_reminders || all_reminders.length == 0) return;

        for (let data of all_reminders) {
            let user = this.client.users.cache.get(data.created_by) || await this.client.users.fetch(data.created_by)
            if ((parseInt(data.created_at) + parseInt(data.time)) < Date.now()) {
                let channel = this.client.channels.cache.get(data.channel) || await this.client.channels.fetch(data.created_by).catch(err => null)

                const modal = new ModalBuilder()
                    .setCustomId(`updaterm_${user.id}_${data.id}`)
                    .setTitle('Adiar lembrete');

                const time = new TextInputBuilder()
                    .setCustomId(`reminder_time`)
                    .setLabel(`Quando devo te avisar novamente?`)
                    .setPlaceholder(`10m, 25/12/2022 22:00, 1 hora 30 minutos...`)
                    .setStyle(TextInputStyle.Short)

                const rowModal = new ActionRowBuilder().addComponents(time)
                modal.addComponents(rowModal)

                const buttons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Primary)
                            .setCustomId("confirm")
                            .setLabel('Adiar lembrete')
                            .setEmoji('📅'),
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Danger)
                            .setCustomId("cancel")
                            .setEmoji('🗑')
                            .setLabel('Apagar lembrete')
                    )

                await this.client.psql.reminders.update({ is_alerted: true }, { where: { id: data.id } })

                if (!channel) {
                    return await user.send({
                        content: `🔔 ${user.toString()}, Lembrete! \`${data.message}\``,
                    })

                }
                let reminder_msg = await channel.send({
                    content: `🔔 ${user.toString()}, Lembrete! \`${data.message}\``,
                    components: [buttons]
                })

                let collector = reminder_msg?.createMessageComponentCollector({
                    filter: (int) => int.user.id === user.id,
                    time: 30000,
                    max: 1
                })

                collector.on("collect", async (int) => {
                    if (int.customId === 'confirm') {
                        return int.showModal(modal)
                    } else {
                        await this.client.psql.deleteReminder(data.id)
                        return reminder_msg?.edit({ components: [] }).catch(() => { })
                    }
                })

                collector.on("end", () => {
                    return reminder_msg?.edit({ components: [] }).catch(() => { })
                })
            }
        }

    }

    async resetTasks() {
        await this.client.psql.getTasks(this.client.user.id)
        let new_number = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
        let new_tasks = {
            work: new_number(1, 4),
            crime: new_number(1, 3),
            reps: new_number(1, 4),
            bets: new_number(1, 11),
            raffle: new_number(10, 70)
        }
        await this.client.psql.resetTasks()
        await this.client.psql.updateTasks(this.client.user.id, new_tasks)

    }

    async betTax() {
        let users = await this.client.psql.users.findAll({
            where: {
                money: {
                    [Op.gte]: 10_000_000
                }
            },
            raw: true
        })
        let text_logs = ''
        let bet_tax = [
            {
                moneyLimit: 1_000_000_000,
                minBet: 55,
                taxRate: 0.50
            },
            {
                moneyLimit: 500_000_000,
                minBet: 35,
                taxRate: 0.35
            },
            {
                moneyLimit: 100_000_000,
                minBet: 25,
                taxRate: 0.25
            },
            {
                moneyLimit: 10_000_000,
                minBet: 15,
                taxRate: 0.10
            }
        ]

        for (let user in users) {

            let day_ms = new Date(new Date().getTime() - (3 * 24 * 60 * 60 * 1000)).getTime();
            let value = await this.client.psql.transactions.findAll({
                where: {
                    given_at: {
                        [Op.gt]: day_ms
                    },
                    [Op.or]: [{
                        given_by: users[user].id
                    }, {
                        received_by: users[user].id,
                    }],
                    source: [6, 7, 8, 13, 14],
                },

                raw: true,
                attributes: [
                    [this.client.psql.fn('SUM', this.client.psql.col('amount')), 'total_valor']
                ],
            })
            let flag = false

            for (let i = 0; i < bet_tax.length; i++) {
                let {
                    moneyLimit,
                    minBet,
                    taxRate
                } = bet_tax[i]
                let u_money = users[user].money
                if (moneyLimit < parseInt(u_money) && (minBet / 100) * u_money > value[0].total_valor && !flag) {
                    let user_fetch = await this.client.users.fetch(users[user].id)

                    let tax = parseInt(u_money * taxRate)
                    await this.client.psql.updateUser(users[user].id, {
                        money: parseInt(u_money) - tax
                    })
                    await this.client.psql.transactions.create({
                        source: 17,
                        given_by: users[user].id,
                        given_at: Date.now(),
                        amount: tax
                    })

                    flag = true
                    text_logs += `${user_fetch.tag} (${user_fetch.id}), perdeu ${taxRate * 100}% de suas moedas! O usuário tinha ${Number(u_money).toLocaleString()} moedas e agora tem ${(u_money - tax).toLocaleString()}!\n`
                }
            }
        }
        this.client.logger.taxDaily(text_logs, 'BetTax')
    }

    async warnWeddingTax(users) {
        for (let user in users) {
            let user_dc = await this.client.users.fetch(users[user].id)
            user_dc.send({
                content: `💔 Seu casamento está com risco de encerrar, você deve ter pelo menos 50.000 moedas para continuar, você possui apenas ${users[user].money.toLocaleString()}!\n> Caso não consiga seu casamento irá encerrar as 00:00.`
            })

        }
    }

    async weddingTax(users) {
        for (let user in users) {
            let user_marry = await this.client.users.fetch(users[user].id)
            let parent = await this.client.users.fetch(users[user]['social.wedding_user'])
            let update = {
                wedding: false,
                wedding_user: null,
                wedding_date: null
            }

            this.client.psql.social.update(update, {
                where: {
                    [Op.or]: [{
                        id: parent.id
                    },
                    {
                        id: user_marry.id
                    }
                    ]
                }
            })

            user_marry.send({
                content: `> 💍 Infelizmente seu casamento com seu/sua parceiro(a) \`${parent.username}\` foi encerrado devido a falta de moedas para mantê-lo!`
            })

            parent.send({
                content: `> 💍 Infelizmente seu casamento com seu/sua parceiro(a) \`${user_marry.username}\` foi encerrado devido a falta de moedas para mantê-lo!`
            })
        }
    }

    async checkBoosters() {
        let boosterRoleId = "992988396148506625"
        let vipRoleid = "992988396148506625"
        let guild = this.client.guilds.cache.get("905867817600049173")
        let vips = await this.client.psql.users.findAll({
            raw: true,
            where: {
                premium: {
                    [Sequelize.Op.and]: {
                        [Sequelize.Op.gte]: Date.now(),
                        [Sequelize.Op.ne]: 0
                    }
                }
            }
        })
        for (booster of vips) {
            if (!guild.members.cache.has(booster.id) || !guild.members.cache.get(booster.id).roles.cache.has(boosterRoleId)) {
                if (guild.members.cache.get(booster.id).roles.cache.has(vipRoleid)) return
                await this.client.psql.updateUserPremium(booster.id, ms('1s'))
            }
        }
    }
}