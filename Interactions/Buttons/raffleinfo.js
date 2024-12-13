import { EmbedBuilder } from "discord.js"

export default {
	name: 'raffle_p',
	execute: async (client, interaction) => {
		await interaction.deferUpdate().catch(() => null)

		let users = await client.psql.getRaffleUsers()
		let rf_info = await client.psql.getRaffleData(client.user.id)

		let msg = await Promise.all(users.map(async (result, index) => {
			let u = await client.users.fetch(result.author)
			return `\`${index + 1}\` - ${u.tag} (\`${u.id}\`) comprou **${parseInt(result.ticket_count).toLocaleString()}** bilhetes **(${client.utils.calcPercentage(result.ticket_count, rf_info.total, 2)})**.`
		}))

		let embed = new EmbedBuilder()

			.setFooter({ text: '@' + client.user.username, iconURL: client.user.displayAvatarURL() })
			.setColor(client.config.colors.default)
			.setTimestamp()

			.setTitle('Participantes')
			.setDescription(msg.length >= 1 ? msg.join("\n") : `Ninguém`)


		interaction.followUp({
			embeds: [embed],
			ephemeral: true
		})
	}
}
