import { EmbedBuilder } from "discord.js"
import ms from "ms"

export default {
    name: 'profile_rep_',
    execute: async (client, interaction) => {
        let split = interaction.customId.split("_")

        await interaction.deferUpdate().catch(() => null)

        let user = await interaction.client.users.fetch(split[2])
        let user_db = await client.psql.users.findOne({ where: { id: user.id }, include: { model: client.psql.social, as: 'social' }, raw: true })
        let cds = await client.psql.getCooldowns(interaction.user.id)

        if (Number(cds.rep) > Date.now()) return interaction.followUp({
            content: `⏰ ${interaction.user.toString()}, espere \`${await client.utils.formatTime(Number(cds.rep))}\` para poder utilizar esse comando novamente!`,
            ephemeral: true
        })

        if (!user || user.id == interaction.user.id) return interaction.followUp({
            content: `❌ ${interaction.user.toString()}, diga-me um usuário válido para enviar essa reputação!`,
            ephemeral: true
        })

        await client.psql.updateSocialReps(split[2], 1)
        await client.psql.updateCooldowns(interaction.user.id, 'rep', ms('1h') + Date.now())
        await client.psql.reputations.create({
            received_by: user.id,
            given_by: interaction.user.id,
            received_by_tag: user.tag,
            given_by_tag: interaction.user.tag,
            given_at: Date.now(),
            message: null
        })


        return interaction.followUp({
            content: `💘 ${interaction.user.toString()}, reputação enviada com sucesso! Agora ${user.toString()} possui ${user_db['social.reps'] + 1} reputações!`,
            ephemeral: true
        })
    }
} 