import {
	Sequelize,
	Op,
	DataTypes,
	fn,
	col
} from "sequelize";
import Chalk from "chalk";

import ms from "ms"
import config from "../Assets/Json/config.json" assert { type: "json"}

class database extends Sequelize {
	constructor() {
		super('name', 'user', 'password', {
			host: 'host',
			logging: false,
			port: port,
			dialect: 'postgres',
			timezone: '-03:00'
		})
		this.authenticate().then(() => console.log(Chalk.yellow('[PSQL] ') + 'Banco de dados conectado!'))
	}
	async loadModels() {
		this.users = await import('./Models/users.js').then(model => model.default(this, DataTypes))
		this.guilds = await import('./Models/guilds.js').then(model => model.default(this, DataTypes))
		this.social = await import('./Models/social.js').then(model => model.default(this, DataTypes))
		this.cooldowns = await import('./Models/cooldowns.js').then(model => model.default(this, DataTypes))
		this.raffle = await import('./Models/raffle.js').then(model => model.default(this, DataTypes))
		this.transactions = await import('./Models/transactions.js').then(model => model.default(this, DataTypes))
		this.reputations = await import('./Models/reputations.js').then(model => model.default(this, DataTypes))
		this.commands = await import('./Models/commands.js').then(model => model.default(this, DataTypes))
		this.raffle_buyers = await import('./Models/rafflebuyers.js').then(model => model.default(this, DataTypes))
		this.reminders = await import('./Models/reminders.js').then(model => model.default(this, DataTypes))
		this.tasks = await import('./Models/tasks.js').then(model => model.default(this, DataTypes))
		this.workers = await import('./Models/employees.js').then(model => model.default(this, DataTypes))

		this.sync({
			alter: true
		}).then(() => console.log(Chalk.yellow('[PSQL] ') + 'Banco de dados sincronizado!'))

		this.users.hasOne(this.cooldowns, {
			foreignKey: 'id',
			as: 'cooldown'
		});
		this.cooldowns.belongsTo(this.users, {
			foreignKey: 'id',
			as: 'user'
		});

		this.users.hasOne(this.social, {
			foreignKey: 'id',
			as: 'social'
		});
		this.social.belongsTo(this.users, {
			foreignKey: 'id',
			as: 'user'
		});

	}

	async getUser(user_id) {
		let data = await this.users.findOne({
			where: {
				id: user_id
			},
			raw: true
		})

		if (!data) {
			data = await this.users.create({
				id: user_id
			})
			data = data.dataValues
		}

		data.money = BigInt(data.money)
		return data
	}

	async updateUser(user_id, data) {
		return await this.users.update(data, {
			where: {
				id: user_id
			}
		})
	}

	async updateUserMoney(user_id, amount) {
		let data = await this.getUser(user_id)
		amount = BigInt(data.money) + BigInt(amount)

		return await this.users.update({ money: amount }, { where: { id: user_id } })
	}

	async updateUserVotes(user_id, amount) {
		let data = await this.getUser(user_id)

		return await this.users.update({ votes: data.votes + amount }, { where: { id: user_id } })
	}

	async updateUserBets(user_id, amount) {
		let data = await this.getUser(user_id)

		return await this.users.update({ bets: data.bets + amount }, { where: { id: user_id } })
	}

	async getUserPremium(user_id) {
		let data = await this.getUser(user_id)
		return Number(data.premium) > Date.now()
	}

	async updateUserPremium(user_id, time) {
		return this.updateUser(user_id, {
			premium: Date.now() + time
		});
	}

	async getGuild(guild_id) {
		let data = await this.guilds.findOne({
			where: {
				id: guild_id
			},
			raw: true
		})

		if (!data) {
			data = await this.guilds.create({
				id: guild_id
			})
			data = data.dataValues

		}

		return data
	}

	async updateGuild(guild_id, data) {
		return await this.guilds.update(data, {
			where: {
				id: guild_id
			}
		})
	}

	async getGuildPrefix(guild_id) {
		let data = await this.getGuild(guild_id)
		return data.prefix
	}

	async getGuildPremium(user_id) {
		let data = await this.getGuild(user_id)
		return Number(data.premium) > Date.now()
	}

	async getProfile(user_id) {
		let data = await this.getUser(user_id)
		let social = await this.getSocial(user_id)

		return Object.assign(data, social)
	}

	async getCooldowns(user_id) {
		let data = await this.cooldowns.findOrCreate({
			where: {
				id: user_id
			}
		})
		return data[0].dataValues
	}

	async updateCooldowns(user_id, cooldown, timestamp) {
		await this.cooldowns.update({
			[cooldown]: timestamp
		}, {
			where: {
				id: user_id
			}
		})
	}

	async resetRaffle(winner, amount, client_id) {
		await this.updateUserMoney(winner, amount)
		await this.updateUser(winner, {
			tickets: 0
		})
		await this.raffle.update({
			quantity: 0,
			total: 0,
			participants: 0,
			last_winner: winner,
			last_value: amount,
			ends_in: Date.now() + ms('30m')
		}, {
			where: {
				id: client_id
			}
		})
		await this.raffle_buyers.destroy({
			where: {}
		})

	}

	async getRaffleData(client_id) {
		let data = await this.raffle.findOrCreate({
			where: {
				id: client_id
			}
		})

		return data[0].dataValues
	}

	async getRaffleUsers() {
		return await this.raffle_buyers.findAll({
			attributes: ['author', [fn('count', col('id')), 'ticket_count']],
			group: ['author'],
			order: [
				[fn('count', col('id')), 'DESC']
			],
			raw: true
		})

	}

	async raffleInfo(client_id) {
		return await this.raffle.findOne({
			where: {
				id: client_id
			},
			raw: true
		})
	}

	async verifyUser(user_id) {
		return await this.raffle_buyers.count({
			where: {
				author: user_id
			},
			raw: true
		})
	}

	async ticketCounter(filter = {}) {
		return await this.raffle_buyers.count({
			where: filter
		})
	}


	async updateRaffle(author, client_id, tickets) {
		let data = []
		let new_user = await this.verifyUser(author.id) > 0 ? 0 : 1
		for (let i = 0; i < tickets; i++) {
			data.push({
				author: author.id,
				buyed_at: Date.now()
			})
		}
		await this.raffle_buyers.bulkCreate(data)

		let raffle_info = await this.raffleInfo(client_id)
		let ticket_count = await this.ticketCounter()
		await this.raffle.update({
			quantity: ticket_count * 250,
			total: ticket_count,
			participants: raffle_info.participants + new_user
		}, {
			where: {
				id: client_id
			}
		})

	}



	async getSocial(user_id) {
		let data = await this.social.findOne({
			where: {
				id: user_id
			},
			raw: true
		})

		if (!data) {
			data = await this.social.create({
				id: user_id
			})
			data = data.dataValues
		}

		return data
	}

	async updateSocial(user_id, data) {
		return await this.social.update(data, {
			where: {
				id: user_id
			}
		})
	}

	async updateSocialReps(user_id, amount) {
		let data = await this.getSocial(user_id)
		return await this.social.update({
			reps: data.reps + amount
		}, {
			where: {
				id: user_id
			}
		})
	}

	async getReps(user_id, limit = 10, offset = 0, type = 'all') {
		offset *= 10
		let where = {
			'all': {
				[Op.or]: [
					{ given_by: user_id },
					{ received_by: user_id },
				]
			},
			'received': {
				received_by: {
					[Op.eq]: user_id
				},
				given_by: {
					[Op.ne]: user_id
				}
			},
			'sent': {
				given_by: {
					[Op.eq]: user_id
				},
				received_by: {
					[Op.ne]: user_id
				}
			}
		}
		return await this.reputations.findAll({
			where: where[type],
			order: [['given_at', 'DESC']],
			limit: limit,
			offset: offset,
			raw: true
		})

	}

	async countReps(user_id, type = 'all') {
		let where = {
			'all': {
				[Op.or]: [
					{ given_by: user_id },
					{ received_by: user_id },
				]
			},
			'received': {
				received_by: {
					[Op.eq]: user_id
				}
			},
			'sent': {
				given_by: {
					[Op.eq]: user_id
				}
			}
		}
		return await this.reputations.count({
			where: where[type]
		})
	}

	async getAllReminders(user_id) {
		return await this.reminders.findAll({
			where: {
				created_by: user_id,
				is_alerted: false
			},
			raw: true
		})
	}

	async getReminder(user_id, reminder_id) {
		return await this.reminders.findOne({
			where: {
				created_by: user_id,
				id: reminder_id
			},
			raw: true
		})
	}

	async createReminder(data, time, reason) {
		await this.reminders.create({
			created_at: Date.now(),
			created_by: data.author?.id || data.user.id,
			message: reason,
			channel: data.channel.id,
			is_automatic: true,
			is_alerted: false,
			time: time
		})
	}

	async deleteReminder(reminder_id) {
		await this.reminders.destroy({
			where: {
				id: reminder_id
			}
		})
	}

	async getTasks(user_id) {
		let tasks = await this.tasks.findOne({
			where: {
				id: user_id
			},
			raw: true
		})

		if (!tasks) {
			await this.tasks.create({
				id: user_id
			})

			tasks = await this.tasks.findOne({
				where: {
					id: user_id
				}
			})

		}

		return tasks
	}


	async updateTasks(user_id, update) {
		await this.tasks.update(update, {
			where: {
				id: user_id
			}
		})
	}

	async resetTasks() {
		await this.tasks.update({
			work: 0,
			crime: 0,
			reps: 0,
			bets: 0,
			raffle: 0,
			daily: false,
			vote: false,
			completed: false
		}, {
			where: {}
		})
	}


	async createTransaction(data) {
		return await this.transactions.create(data)
	}

	async createTransactions(data) {
		return await this.transactions.bulkCreate(data)
	}

	async getTransactions(user_id, limit = 1000, offset = 0, sources = []) {
		offset *= 10
		let where_query = {
			[Op.or]: [
				{ received_by: user_id },
				{ given_by: user_id, }
			]
		};
		if (sources.length > 0) {
			where_query = {
				source: sources,
				...where_query
			}
		}
		return await this.transactions.findAll({
			raw: true,
			where: where_query,
			order: [['given_at', 'DESC']],
			limit: limit,
			offset: offset
		})
	}

	async getTrCounter(user_id, sources = []) {
		let where_query = {
			[Op.or]: [
				{ received_by: user_id },
				{ given_by: user_id }
			]
		}
		if (sources.length > 0) {
			where_query = {
				source: sources,
				...where_query
			}
		}
		return await this.transactions.count({
			where: where_query
		})
	}

	async getBetTrCounter(user_id) {

	}

	async displayTransaction(tr, user = null) {
		let sources = [
			`[<t:${Math.floor(tr.given_at / 1000)}:d> <t:${Math.floor(tr.given_at / 1000)}:T>] 📥 Recebeu ${BigInt(tr.amount).toLocaleString()} moedas dos administradores`,
			`[<t:${Math.floor(tr.given_at / 1000)}:d> <t:${Math.floor(tr.given_at / 1000)}:T>] 📤 Enviou ${BigInt(tr.amount).toLocaleString()} moedas para os administradores`,
			`[<t:${Math.floor(tr.given_at / 1000)}:d> <t:${Math.floor(tr.given_at / 1000)}:T>] 📥 Recebeu ${BigInt(tr.amount).toLocaleString()} moedas na recompensa diária`,
			`[<t:${Math.floor(tr.given_at / 1000)}:d> <t:${Math.floor(tr.given_at / 1000)}:T>] 📥 Recebeu ${BigInt(tr.amount).toLocaleString()} moedas na recompensa semanal`,
			`[<t:${Math.floor(tr.given_at / 1000)}:d> <t:${Math.floor(tr.given_at / 1000)}:T>] 📥 Recebeu ${BigInt(tr.amount).toLocaleString()} moedas trabalhando`,
			`[<t:${Math.floor(tr.given_at / 1000)}:d> <t:${Math.floor(tr.given_at / 1000)}:T>] ${tr.received_by === user.id ? '📥 Recebeu' : '📤 Enviou'} ${BigInt(tr.amount).toLocaleString()} moedas em uma corrida`,
			`[<t:${Math.floor(tr.given_at / 1000)}:d> <t:${Math.floor(tr.given_at / 1000)}:T>] ${tr.received_by === user.id ? '📥 Recebeu' : '📤 Enviou'} ${BigInt(tr.amount).toLocaleString()} moedas em um pagamento ${tr.received_by === user.id ? 'de' : 'para'} \`${tr.received_by === user.id ? tr.given_by_tag : tr.received_by_tag}\` \`(${tr.received_by === user.id ? tr.given_by : tr.received_by})\``,
			`[<t:${Math.floor(tr.given_at / 1000)}:d> <t:${Math.floor(tr.given_at / 1000)}:T>] ${tr.received_by === user.id ? '📥 Recebeu' : '📤 Enviou'} ${BigInt(tr.amount).toLocaleString()} moedas ${tr.received_by === user.id ? 'de' : 'para'} rifa`,
			`[<t:${Math.floor(tr.given_at / 1000)}:d> <t:${Math.floor(tr.given_at / 1000)}:T>] ${tr.received_by === user.id ? '📥 Recebeu' : '📤 Enviou'} ${BigInt(tr.amount).toLocaleString()} moedas apostando com \`${tr.received_by !== user.id ? tr.given_by_tag : tr.received_by_tag}\` \`(${tr.received_by !== user.id ? tr.given_by : tr.received_by})\``,
			`[<t:${Math.floor(tr.given_at / 1000)}:d> <t:${Math.floor(tr.given_at / 1000)}:T>] 📤 Enviou ${BigInt(tr.amount).toLocaleString()} moedas para a taxa de recompensa diária`,
			`[<t:${Math.floor(tr.given_at / 1000)}:d> <t:${Math.floor(tr.given_at / 1000)}:T>] 📥 Recebeu ${BigInt(tr.amount).toLocaleString()} moedas em um sorteio especial`,
			`[<t:${Math.floor(tr.given_at / 1000)}:d> <t:${Math.floor(tr.given_at / 1000)}:T>] ${tr.received_by === user.id ? '📥 Recebeu' : '📤 Enviou'} ${BigInt(tr.amount).toLocaleString()} moedas cometendo um crime`,
			`[<t:${Math.floor(tr.given_at / 1000)}:d> <t:${Math.floor(tr.given_at / 1000)}:T>] ${tr.received_by === user.id ? '📥 Recebeu' : '📤 Enviou'} ${BigInt(tr.amount).toLocaleString()} moedas jogando 21`,
			`[<t:${Math.floor(tr.given_at / 1000)}:d> <t:${Math.floor(tr.given_at / 1000)}:T>] 📥 Recebeu ${BigInt(tr.amount).toLocaleString()} moedas nas tarefas diárias`,
			`[<t:${Math.floor(tr.given_at / 1000)}:d> <t:${Math.floor(tr.given_at / 1000)}:T>] ${tr.received_by === user.id ? '📥 Recebeu' : '📤 Enviou'} ${BigInt(tr.amount).toLocaleString()} moedas jogando dados`,
			`[<t:${Math.floor(tr.given_at / 1000)}:d> <t:${Math.floor(tr.given_at / 1000)}:T>] 📤 Enviou ${BigInt(tr.amount).toLocaleString()} moedas comprando fundos de perfil`,
			`[<t:${Math.floor(tr.given_at / 1000)}:d> <t:${Math.floor(tr.given_at / 1000)}:T>] 📤 Enviou ${BigInt(tr.amount).toLocaleString()} moedas para a taxa de aposta`,
			`[<t:${Math.floor(tr.given_at / 1000)}:d> <t:${Math.floor(tr.given_at / 1000)}:T>] ${tr.received_by === user.id ? '📥 Recebeu' : '📤 Enviou'} ${BigInt(tr.amount).toLocaleString()} moedas apostando em cavalos`,
			`[<t:${Math.floor(tr.given_at / 1000)}:d> <t:${Math.floor(tr.given_at / 1000)}:T>] ${tr.received_by === user.id ? '📥 Recebeu' : '📤 Enviou'} ${BigInt(tr.amount).toLocaleString()} moedas apostando em um caça-níqueis`,
			`[<t:${Math.floor(tr.given_at / 1000)}:d> <t:${Math.floor(tr.given_at / 1000)}:T>] 📥 Recebeu ${BigInt(tr.amount).toLocaleString()} moedas adivinhando a palavra do dia`,
			`[<t:${Math.floor(tr.given_at / 1000)}:d> <t:${Math.floor(tr.given_at / 1000)}:T>] ${tr.received_by === user.id ? '📥 Recebeu' : '📤 Enviou'} ${BigInt(tr.amount).toLocaleString()} moedas jogando trivia com \`${tr.received_by !== user.id ? tr.given_by_tag : tr.received_by_tag}\` \`(${tr.received_by !== user.id ? tr.given_by : tr.received_by})\``,
			`[<t:${Math.floor(tr.given_at / 1000)}:d> <t:${Math.floor(tr.given_at / 1000)}:T>] 📥 Recebeu ${BigInt(tr.amount).toLocaleString()} moedas por impulsionar o servidor oficial!`,
			`[<t:${Math.floor(tr.given_at / 1000)}:d> <t:${Math.floor(tr.given_at / 1000)}:T>] ${tr.received_by === user.id ? '📥 Recebeu' : '📤 Enviou'} ${BigInt(tr.amount).toLocaleString()} moedas apostando no mines`,
			`[<t:${Math.floor(tr.given_at / 1000)}:d> <t:${Math.floor(tr.given_at / 1000)}:T>] 📥 Recebeu ${BigInt(tr.amount).toLocaleString()} moedas na recompensa VIP`,
		]

		return sources[tr.source - 1]
	}

	async getWorker(user_id) {
		let data = await this.workers.findOne({ where: { id: user_id }, raw: true })

		if (!data) {
			await this.workers.create({ id: user_id })
			data = await this.workers.findOne({ where: { id: user_id }, raw: true })
		}

		return data
	}

	async updateWorker(user_id, data) {
		return await this.workers.update(data, { where: { id: user_id } })
	}

	async addWorkerExp(user_id, exp, job) {
		let worker = await this.getWorker(user_id)
		let experience = worker.exp + exp

		if (!worker) return;

		while (experience >= 100) {
			worker.level++
			worker.salary += config.jobs[job].salary_per_level
			experience -= 100
		}

		if (worker.level >= 25) {
			worker.level = 25
			worker.salary = (config.jobs[job].salary_per_level * 25) + config.jobs[job].initial_salary
			experience = 100
		}

		await this.workers.update({
			level: worker.level,
			exp: experience,
			salary: worker.salary
		}, { where: { id: worker.id } })

		return {
			level: worker.level,
			exp: experience,
			salary: worker.salary
		}
	}

}

export default database
