import Command from "../../Structures/command.js"

import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js"

import ms from "ms"

export default class VIPCommand extends Command {
    constructor(client) {
        super(client, {
            name: "vip",
            description: "Veja algumas informações sobre o plano VIP!",
            aliases: ['premium', 'v.i.p', 'buyvip']
        })
    }

    async run(message, args) {
        let user = await this.client.psql.getUser(message.author.id)

        if (Number(user.premium) > Date.now() && ['claim', 'resgatar'].includes(args[0])) {
            let cds = await this.client.psql.getCooldowns(message.author.id, true)
            let amount = this.client.utils.genNumber(15_000, 20_000)
            let next = Date.now() + ms('4h')

            if (Number(cds.vip) > Date.now()) return message.reply({
                content: `⏰ ${message.author.toString()}, espere \`${await this.client.utils.formatTime(Number(cds.vip), 2)}\` para poder utilizar esse comando novamente!`
            })

            let embed = new EmbedBuilder()

                .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })
                .setColor(this.client.config.colors.default)
                .setTimestamp()

                .setThumbnail(`https://cdn.discordapp.com/attachments/1018619704883036250/1187429641082908822/image.png?ex=6596db07&is=65846607&hm=65423b1d6de88b1352ee7ae6f0410506601f202fee5e74fc481994ade6185872&`)
                .setTitle('Recompensa VIP')
                .setDescription(`${message.author.toString()}, parabéns, você coletou sua recompensa VIP! Nela você ganhou **🪙 ${amount.toLocaleString()} moedas**! (volte em \`4 horas\` para coletar novamente)`)

            let row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Lembrar-me')
                        .setCustomId(`remind_${message.author.id}_${next}_vip-claim`)
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🔔')
                        .setDisabled(false)
                )

            await this.client.psql.updateCooldowns(message.author.id, 'vip', next)
            await this.client.psql.updateUserMoney(message.author.id, amount)
            await this.client.psql.createTransaction({
                source: 24,
                received_by: message.author.id,
                given_at: Date.now(),
                amount: amount
            })

            message.reply({
                content: message.author.toString(),
                embeds: [embed],
                components: [row]
            })
        } else {
            let row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setURL(this.client.config.links.official_guild)
                        .setStyle(ButtonStyle.Link)
                        .setLabel('Comprar VIP')
                )

            let embed = new EmbedBuilder()

                .setColor(this.client.config.colors.default)
                .setTimestamp()
                .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })

                .setTitle(`Benefícios VIP`)
                .setDescription(`Cansado de ter que pagar taxa em todos os comandos de aposta? Está ganhando poucas moedas em seus comandos de coleta? Por um preço acessível você pode obter esses e outros benefícios dentro do Kingg e do seu servidor!\nConfira a seguir os benefícios atuais do plano VIP. Para adquirir, entre no servidor oficial utilizando o botão abaixo!`)

                .setFields([

                    {
                        name: `Preço`,
                        value: `O VIP atualmente custa **R$ 15.00**!`,
                        inline: true
                    },
                    {
                        name: `Status`,
                        value: `${Number(user.premium) > Date.now() ? `Plano de assinatura ativo! (${this.client.utils.formatTime(Number(user.premium), 2)} restantes)` : `Nenhum plano ativo!`}`,
                        inline: true
                    },
                    {
                        name: `Benefícios`,
                        value: `- Taxa zerada em **todos** os comandos de aposta!\n- Comandos de coleta com recompensa **dobrada**!\n- Permissão para personalizar o emoji de suas apostas!\n- Insígnia especial no seu perfil! (👑)\n- Comando de coleta de moedas exclusivo! \`(${await this.client.psql.getGuildPrefix(message.guild.id)}vip resgatar)\`\n- Limite de apostas por hora aumentadas! \`(30 -> 50)\`\n- Permissão para personalizar o emoji de suas apostas!\n- Cargo decorativo especial no servidor oficial!`,
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
}