import Command from "../../Structures/command.js"

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Collection } from "discord.js"

const exhaust = new Collection()

export default class RaceCommand extends Command {
    constructor(client) {
        super(client, {
            name: "mines",
            description: "Aposte em um campo minado, se estourar, perdeu!",
            aliases: ['campominado', 'mine'],
            usage: '<valor>'
        })
    }

    async run(message, args) {
        if (['info', 'informações', 'information', 'informations'].includes(args[0]?.toLowerCase())) return await info(this.client)

        let author_data = await this.client.psql.getUser(message.author.id)
        let premium = await this.client.psql.getUserPremium(message.author.id)
        let amount = this.client.utils.formatNumber(args[0], author_data.money, 0, 50_000)
        let control = { multiplier: 0.03, count: 0, bombs: [] }

        if (!amount || isNaN(amount) || amount === 0 || amount > 10_000_000_000) return message.reply({
            content: `❌ ${message.author.toString()}, me informe uma quantia válida para apostar!`
        });

        if (author_data.money < amount) return message.reply({
            content: `❌ ${message.author.toString()}, você não tem saldo suficiente para fazer essa aposta!`
        });

        if (amount < 100 || amount > 50_000) return message.reply({
            content: `❌ ${message.author.toString()}, o valor da aposta precisa ser maior que 100 moedas e menor que 50.000!`
        })

        if (author_data.bets >= 30 && !premium || author_data.bets >= 50 && premium) return message.reply({
            content: `❌ ${message.author.toString()}, você atingiu o limite de apostas por hora, tente novamente mais tarde!${premium ? '' : ' (Aumente seu limite para **50** virando **VIP**)'}`
        })

        let buttons = genButtons(), ended = false

        await this.client.psql.updateUserBets(message.author.id, 1)
        await this.client.psql.updateUserMoney(message.author.id, -amount)
        await this.client.psql.transactions.create({
            source: 23,
            given_by: message.author.id,
            given_by_tag: message.author.tag,
            given_at: Date.now(),
            amount: amount
        })

        let embed = new EmbedBuilder()

            .setColor(this.client.config.colors.default)
            .setFooter({ text: `Você apostou ${amount.toLocaleString()} moedas - @` + message.author.username, iconURL: message.author.displayAvatarURL() })
            .setTimestamp()

            .setTitle("🍀 Mina da Sorte")
            .setDescription(`Clique na reação "✅" para parar o jogo e resgatar o prêmio atual!`)
            .addFields([
                {
                    name: "Próximo multiplicador",
                    value: `**${control.multiplier}x** --> **${(control.multiplier * 1.5).toFixed(2)}x**`
                },
                {
                    name: "Retirada no valor de",
                    value: `**${parseInt(amount * control.multiplier).toLocaleString()}** moedas 🪙`
                },
                {
                    name: "Quantidade de diamantes e bombas",
                    value: `💎 **${25 - control.bombs.length}** Diamantes\n💣 **${control.bombs.length}** Bombas`
                }
            ])

        let showDiamonds = ""
        if (message.author.id === '799086286693597206') showDiamonds = `\`(${control.bombs.join(" - ")}\``

        let bot_message = await message.reply({
            content: `${message.author.toString()}, clique na reação "✅" para parar o jogo e resgatar o prêmio atual! ${showDiamonds}`,
            embeds: [embed],
            components: buttons
        })
        bot_message?.react('✅')

        let claim = bot_message?.createReactionCollector({
            filter: (r, u) => u.id === message.author.id && r.emoji.name === "✅"
        })

        let collector = bot_message?.createMessageComponentCollector({
            filter: (int) => int.user.id === message.author.id,
            idle: 60_000 * 4
        })

        collector.on("collect", async (int) => {
            await int.deferUpdate().catch(() => null)

            if (exhaust.has(`mines_${message.author.id}`)) return;
            exhaust.set(`mines_${message.author.id}`, true)
            setTimeout(() => exhaust.delete(`mines_${message.author.id}`), 1200)

            if (control.bombs.includes(Number(int.customId))) {
                let bt = buttons[buttons.findIndex(x => x.components.find(x => x.data.custom_id === int.customId))].components.find(x => x.data.custom_id === int.customId).data

                bt.disabled = true,
                    bt.label = null,
                    bt.style = ButtonStyle.Danger,
                    bt.emoji = { name: "💥" },
                    control['bomb'] = Number(int.customId)

                disableButtons()
                ended = true

                let lose = new EmbedBuilder()

                    .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp()
                    .setColor(this.client.config.colors.red)

                    .setTitle("Fim de jogo")
                    .setTimestamp()
                    .setDescription(`${message.author.toString()}, você clicou em uma bomba e explodiu, você perdeu **${amount.toLocaleString()}** moedas 🪙! Que tal tentar novamente?`)

                bot_message?.edit({
                    embeds: [lose],
                    components: buttons
                })

                collector.stop("kabum")
                claim.stop()
            } else {
                let bt = buttons[buttons.findIndex(x => x.components.find(x => x.data.custom_id === int.customId))].components.find(x => x.data.custom_id === int.customId).data
                bt.label = null,
                    bt.disabled = true,
                    bt.style = ButtonStyle.Success,
                    bt.emoji = { name: "💎" }

                control.multiplier = control.multiplier * 1.5
                control.count += 1

                embed = new EmbedBuilder()

                    .setColor(this.client.config.colors.default)
                    .setFooter({ text: `Você apostou ${amount.toLocaleString()} moedas - @` + message.author.username, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp()

                    .setTitle("🍀 Mina da Sorte")
                    .setDescription(`Clique na reação "✅" para parar o jogo e resgatar o prêmio atual!`)
                    .addFields([
                        {
                            name: "Próximo multiplicador",
                            value: `**${control.multiplier.toFixed(2)}x** --> **${(control.multiplier * 1.5).toFixed(2)}x**`
                        },
                        {
                            name: "Retirada no valor de",
                            value: `**${parseInt(amount * control.multiplier).toLocaleString()}** moedas 🪙\nPróximo valor: **${parseInt(amount * (control.multiplier * 1.5)).toLocaleString()}** moedas🪙`
                        },
                        {
                            name: "Quantidade de diamantes e bombas",
                            value: `💎 **${(25 - control.bombs.length) - control.count}** Diamantes\n💣 **${control.bombs.length}** Bombas`
                        }
                    ])

                bot_message?.edit({
                    embeds: [embed],
                    components: buttons
                })
            }
        })

        claim.on("collect", async (r, u) => {
            if (ended) return;
            if (control.count < 1) return;

            ended = true

            collector.stop("reward")
            claim.stop()

            let win = new EmbedBuilder()

                .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })
                .setTimestamp()
                .setColor(this.client.config.colors.green)

                .setTitle("Recompensa resgatada")
                .setTimestamp()
                .setDescription(`${message.author.toString()}, você resgatou com sucesso seu prêmio de **${parseInt(amount * control.multiplier).toLocaleString()}** moedas 🪙, que legal!`)

            disableButtons()

            bot_message?.edit({
                components: buttons,
                embeds: [win]
            })

            await this.client.psql.updateUserMoney(message.author.id, parseInt(amount * control.multiplier))
            await this.client.psql.transactions.create({
                source: 23,
                received_by: message.author.id,
                received_by_tag: message.author.tag,
                given_at: Date.now(),
                amount: parseInt(amount * control.multiplier)
            })
        })

        collector.on("end", async (x, m) => {
            if (m === 'kabum' || m === "reward") return;
            if (parseInt(amount * 0.20) < 500) return;
            if (control.count < 1) return;

            disableButtons()
            let wo = new EmbedBuilder()

                .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })
                .setTimestamp()
                .setColor(this.client.config.colors.red)

                .setTitle("Fim de jogo")
                .setTimestamp()
                .setDescription(`${message.author.toString()}, você ficou inativo! Que tal tentar novamente?`)

            bot_message?.edit({
                embeds: [wo],
                components: buttons
            })

            bot_message.reply({
                content: `❓ ${message.author.toString()}, como você ficou sem pressionar em algum botão por **3 minutos** eu estornei **20%** do valor que você apostou (**${parseInt(amount * 0.20).toLocaleString()}** moedas 🪙)`
            })

            await this.client.psql.updateUserMoney(message.author.id, parseInt(amount * 0.20))
            await this.client.psql.transactions.create({
                source: 23,
                received_by: message.author.id,
                received_by_tag: message.author.tag,
                given_at: Date.now(),
                amount: parseInt(amount * 0.20)
            })
        })

        function disableButtons() {
            let res = 0, h = 0
            for (let i = 0; i < 25; i++) {
                if (res === 5) {
                    res = 0
                    h++
                }
                let bt = buttons[h].components[res].data
                bt.disabled = true
                bt.label = null
                bt.style = control.bombs.includes(i) ? ButtonStyle.Danger : bt.style
                bt.emoji = { name: control.bombs === i ? "💥" : control.bombs.includes(i) ? "💣" : "💎" }
                res++
            }
        }

        function genButtons() {
            let rows = [new ActionRowBuilder()]
            for (let i = 0; i < 6; i++) control.bombs.push(Math.floor(Math.random() * 25))
            control.bombs = control.bombs.filter((a, b) => control.bombs.indexOf(a) === b)
            let res = 0

            for (let i = 0; i < 25; i++) {
                if (res === 5) {
                    res = 0
                    rows.push(new ActionRowBuilder())
                }

                rows[rows.length - 1].addComponents(
                    new ButtonBuilder().setLabel("\u200b").setCustomId(String(i)).setStyle(ButtonStyle.Secondary)
                )
                res++
            }
            return rows
        }

        async function info(client) {
            let emb = new EmbedBuilder()

                .setColor(client.config.colors.blue)
                .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })
                .setTimestamp()

                .setTitle("💡 **Informações**")
                .setDescription(`Para começar, utilize o comando: \`${await client.psql.getGuildPrefix(message.guild.id)}mines <valor>\` (Limite máximo: 50,000 moedas)\nAo acionar o comando, 25 botões serão exibidos. Entre 4 a 6 são bombas 💣, os restantes são diamantes 💎! Cada clique em diamante multiplica o valor. Encontre mais diamantes para ganhar mais! Cuidado com as bombas, clicar nelas encerra o jogo e você perde a aposta inicial.`)
                .addFields([
                    {
                        name: "❓ **E se eu não clicar em nenhuma mina?**",
                        value: "Se não clicar em nenhuma mina, perderá a aposta inicial. Ao clicar em pelo menos uma mina e parar, receberá um retorno de **20% do valor apostado** (o valor inicial ainda é deduzido)."
                    }
                ])

            message.reply({
                content: message.author.toString(),
                embeds: [emb]
            })
        }
    }
}