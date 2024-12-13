import Command from "../../Structures/command.js"

import { ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder } from "discord.js"
import { readdirSync } from "fs"

export default class HelpCommand extends Command {
    constructor(client) {
        super(client, {
            name: "ajuda",
            description: "Veja a minha lista de comandos!",
            aliases: ['help', 'comandos', 'commands', 'commandlist', 'botcommands', 'helpme']
        })
    }

    async run(message, args) {
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
        }

        let dirs = readdirSync("./Commands/"), options = []

        dirs.forEach((folder) => {
            if (folder === "Developer") return;

            options.push({
                label: folders[folder].name,
                emoji: folders[folder].emoji,
                description: folders[folder].desc,
                value: `help_${folder}`
            })
        })

        let row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setPlaceholder('Página')
                    .setDisabled(false)
                    .setMaxValues(1)
                    .setMinValues(1)
                    .addOptions(options)
                    .setCustomId(`help_${message.author.id}`)
            )

        let embed = new EmbedBuilder()

            .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })
            .setColor(this.client.config.colors.default)
            .setTimestamp()

            .setTitle(`Painel de ajuda`)
            .setDescription(`Olá, ${message.author.toString()}! Bem-vindo(a) ao meu painel de ajuda! 👋\nVocê já deve saber utilizar meus comandos, mas caso não saiba, o meu prefixo nesse servidor é \`${await this.client.psql.getGuildPrefix(message.guild.id)}\` e para utilizar um comando você deve por ele antes do nome do comando, exemplo: \`${await this.client.psql.getGuildPrefix(message.guild.id)}help\`\n\nAqui vão alguns links que podem lhe ser úteis:\n> Servidor oficial: [Clique aqui](https://discord.gg/kingg)\n> Me adicione: [Clique aqui](https://discord.com/api/oauth2/authorize?client_id=816841271964467241&permissions=414465780801&scope=bot%20applications.commands)\n> Vote em mim: [Clique aqui](https://top.gg/bot/816841271964467241/vote)\n\nMais algumas informação logo abaixo!`)
            .setThumbnail(this.client.user.displayAvatarURL())
            .setFields([
                {
                    name: `Argumentos`,
                    value: `Ao abrir a página de comandos, observe que alguns comandos possuem palavras indicadas entre símbolos \`(exemplo: <valor>)\`. Esses símbolos indicam se o argumento é obrigatório (\`<exemplo>\`) ou opcional (\`[exemplo]\`).                    `,
                    inline: false
                }
            ])


        return message.reply({
            content: message.author.toString(),
            components: [row],
            embeds: [embed]
        })
    }
}