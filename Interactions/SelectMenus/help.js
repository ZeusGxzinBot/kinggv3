import { readdirSync } from "fs"
import { EmbedBuilder } from "discord.js"

export default {
    name: 'help_',
    execute: async (client, interaction) => {

        let folders = {
            Economy: {
                name: "Economia",
                desc: "Comandos de economia e coleta!",
                emoji: "💸"
            },
            Bets: {
                name: "Apostas",
                desc: "Comandos de jogos e apostas!",
                emoji: "🎲"
            },
            Information: {
                name: "Informações",
                desc: "Comandos informativos!",
                emoji: "📋"
            },
            Jobs: {
                name: "Empregos",
                desc: "Comandos do sistema de trabalho!",
                emoji: "💼"
            },
            Social: {
                name: "Sociais",
                desc: "Comandos sociais e interativos!",
                emoji: "💘"
            },
            Roleplay: {
                name: "Ações",
                desc: "Comandos de ações sociais!",
                emoji: "🤝"
            },
            Utilities: {
                name: "Utilidades",
                desc: "Comandos de úteis para o servidor e usuário!",
                emoji: "✅"
            },
            Configuration: {
                name: "Configurações",
                desc: "Comandos de configurações do servidor!",
                emoji: "🛠️"
            }
        }, prefix = await client.psql.getGuildPrefix(interaction.guild.id)

        await interaction.deferUpdate().catch(e => null)

        let custom_id = interaction.customId.split('_')
        let choice = interaction.values[0].split('_')
        let fields = []

        if (custom_id[1] !== interaction.user.id) return;

        let dir = readdirSync("./Commands/" + choice[1])

        for (let i of dir) {
            let file = new (await import('../../Commands/' + choice[1] + '/' + i)).default
            if (!file.name) return;

            fields.push(`\`${prefix}${file.name}${file.usage ? ' ' + file.usage : ''}\``)
        }

        let embed = new EmbedBuilder()

            .setFooter({ text: '@' + interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
            .setColor(client.config.colors.default)
            .setTimestamp()

            .setTitle(`Painel de ajuda`)
            .setDescription(`${interaction.user.toString()}, aqui está a lista dos meus comandos de **${folders[choice[1]].name}**.\nLembre-se, meu prefixo nesse servidor é \`${prefix}\`!`)
            .setThumbnail(client.user.displayAvatarURL())
            .setFields([
                {
                    name: `${folders[choice[1]].emoji} ${folders[choice[1]].name}`,
                    value: fields.join('\n'),
                    inline: false
                }
            ])

        interaction.message.edit({
            embeds: [embed]
        })
    }
}