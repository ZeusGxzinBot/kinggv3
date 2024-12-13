import Command from "../../Structures/command.js"
import { loadImage } from "canvas"
import { fn, col } from "sequelize"

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"

export default class BackgroundCommand extends Command {
    constructor(client) {
        super(client, {
            name: "background",
            description: "Troque o fundo do seu perfil!",
            aliases: ['backgrounds', 'background', 'bg', 'fundos', 'bgs'],
            usage: '<enviar | lista | comprar>'
        })
    }

    async run(message, args) {
        let option = args[0]?.toLowerCase()
        let profile = await this.client.psql.getProfile(message.author.id)

        if (!['send', 'enviar', 'list', 'lista', 'buy', 'comprar'].includes(option)) return message.reply({
            content: `❌ ${message.author.toString()}, você precisa me dizer um sub-comando válido! Sub-comandos disponíveis: \`comprar\` e \`lista\`!`
        })

        let embed = new EmbedBuilder()

            .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })
            .setColor(this.client.config.colors.default)
            .setTimestamp()

        if (['comprar', 'buy', 'loja', 'shop'].includes(option)) {
            let bgs_array = [
                {
                    "bg": "https://cdn.discordapp.com/attachments/1104547477635465326/1193394852541517884/fundo.png",
                    "value": 70_000
                },
                {
                    "bg": "https://cdn.discordapp.com/attachments/1142247381371453522/1150510936034123787/daenerys.png",
                    "value": 200_000
                },
                {
                    "bg": "https://cdn.discordapp.com/attachments/1142247381371453522/1150518356181524630/anime.png",
                    "value": 150_000
                },
                {
                    "bg": "https://cdn.discordapp.com/attachments/1142247381371453522/1152722065972011060/HD-wallpaper-pixel-art-aesthetic--for-you-pixel-cafe.jpg",
                    "value": 120_000
                },
                {
                    "bg": "https://media.discordapp.net/attachments/1142247381371453522/1152719372985581649/Dragon_20230915_121524_0000.png?width=719&height=449",
                    "value": 60_000
                },
                {
                    "bg": "https://cdn.discordapp.com/attachments/1142247381371453522/1152720583138738246/Novo_projeto_1_4356DFB-1.png",
                    "value": 100_000
                }
            ]

            let arr_counter = 0

            embed.setTitle('Fundos de perfil')
                .setDescription(`Utilize o botão abaixo para comprar esse fundo de perfil!\n> Preço do fundo: **${bgs_array[arr_counter]["value"].toLocaleString()} moedas**`)
                .setImage(bgs_array[arr_counter]["bg"])

            const bgsrow = new ActionRowBuilder()

                .addComponents(
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji("◀")
                        .setCustomId(`back`),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Success)
                        .setEmoji("✅")
                        .setLabel('Comprar')
                        .setCustomId(`buy`),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji("▶️")
                        .setCustomId(`next`)
                )

            let bgs_list = await message.reply({
                content: message.author.toString(),
                embeds: [embed],
                components: [bgsrow]
            })

            let filter = interaction => interaction.user.id == message.author.id;
            let collector = bgs_list.createMessageComponentCollector({
                filter,
                time: 180_000
            })

            collector.on('collect', async (i) => {
                await i.deferUpdate().catch((e) => { null })
                let id = i.customId

                if (id == 'next') { arr_counter += 1 }
                else if (id == 'back') { arr_counter -= 1 }
                else if (id == 'buy') {
                    if (profile.backgrounds.includes(bgs_array[arr_counter]["bg"])) return i.followUp({
                        content: `❌ ${message.author.toString()}, você já tem este fundo de perfil!`,
                        ephemeral: true
                    })

                    let data_user = await this.client.psql.users.findOne({
                        where: {
                            id: message.author.id
                        },
                        attributes: ["money"],
                        raw: true
                    })

                    if (bgs_array[arr_counter]["value"] > BigInt(data_user.money)) return i.followUp({
                        content: `❌ ${message.author.toString()}, você não tem tantas moedas assim para comprar esse fundo de perfil!`,
                        ephemeral: true
                    })


                    await this.client.psql.updateSocial(message.author.id, {
                        backgrounds: fn('array_append', col('backgrounds'), bgs_array[arr_counter]["bg"])
                    })
                    await this.client.psql.updateUserMoney(message.author.id, -bgs_array[arr_counter]["value"])
                    await this.client.psql.createTransaction({
                        source: 16,
                        given_by: message.author.id,
                        given_at: Date.now(),
                        amount: BigInt(bgs_array[arr_counter]["value"])
                    })

                    profile.backgrounds.push(bgs_array[arr_counter]["bg"])

                    i.followUp({
                        content: `✅ ${message.author.toString()}, você comprou este fundo de perfil com sucesso!`,
                        ephemeral: true
                    })
                }
                if (arr_counter >= bgs_array.length) arr_counter = 0
                else if (arr_counter < 0) arr_counter = bgs_array.length - 1

                embed.setImage(bgs_array[arr_counter]["bg"])
                embed.setTitle(`Fundos de perfil (${arr_counter + 1}/${bgs_array.length})`)
                embed.setDescription(`Utilize o botão abaixo para comprar esse fundo de perfil!\n> Preço do fundo: **${bgs_array[arr_counter]["value"].toLocaleString()} moedas**`)

                bgs_list.edit({
                    content: message.author.toString(),
                    embeds: [embed],
                    components: [bgsrow]
                })
            })

            collector.on('end', async () => {
                await bgs_list.edit({
                    content: message.author.toString(),
                    embeds: [embed],
                    components: []
                })
            })
        } else if (['list', 'lista'].includes(option)) {
            let counter = 0
            let bgs = profile.backgrounds

            embed.setTitle(`Fundos de perfil (${counter + 1}/${bgs.length})`)
            embed.setImage(bgs[counter])

            const listrow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji("◀")
                        .setCustomId(`back`),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Success)
                        .setEmoji("✅")
                        .setLabel('Equipar')
                        .setCustomId(`equip`),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji("🗑️")
                        .setLabel('Apagar')
                        .setCustomId(`delete`),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji("▶️")
                        .setCustomId(`next`)
                )

            let list_msg = await message.reply({
                content: message.author.toString(),
                embeds: [embed],
                components: [listrow]
            })

            let filter = interaction => interaction.user.id == message.author.id;
            let collector = list_msg.createMessageComponentCollector({
                filter,
                time: 180_000
            })

            collector.on('collect', async (i) => {
                await i.deferUpdate().catch((e) => { null })

                let id = i.customId
                if (id == 'next') { counter += 1 }
                else if (id == 'back') { counter -= 1 }
                else if (id == 'equip') {
                    await this.client.psql.updateSocial(message.author.id, {
                        background: bgs[counter]
                    })

                    i.followUp({
                        content: `✅ ${message.author.toString()}, você equipou este fundo de perfil com sucesso!`,
                        ephemeral: true
                    })
                }
                else if (id == 'delete') {
                    if (bgs[counter] === 'https://cdn.discordapp.com/attachments/1104547477635465326/1193394852541517884/fundo.png') return i.followUp({
                        content: `❌ ${message.author.toString()}, você não pode apagar este fundo de perfil!!`,
                        ephemeral: true
                    })

                    await this.client.psql.updateSocial(message.author.id, {
                        backgrounds: fn('array_remove', col('backgrounds'), bgs[counter])
                    })

                    bgs = bgs.filter(x => x != bgs[counter])
                    counter -= 1

                    i.followUp({
                        content: `✅ ${message.author.toString()}, você apagou este fundo de perfil com sucesso!`,
                        ephemeral: true
                    })
                }

                if (counter >= bgs.length) counter = 0
                else if (counter < 0) counter = bgs.length - 1

                embed.setImage(bgs[counter])
                embed.setTitle(`Fundos de perfil (${counter + 1}/${bgs.length})`)

                list_msg.edit({
                    content: message.author.toString(),
                    embeds: [embed],
                    components: [listrow]
                })

            })

            collector.on('end', async () => {
                await list_msg.edit({
                    content: message.author.toString(),
                    embeds: [embed],
                    components: []
                })
            })

        }
    }
}