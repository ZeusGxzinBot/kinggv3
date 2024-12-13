import Command from "../../Structures/command.js"

import { PermissionsBitField, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js"

export default class PrefixCommand extends Command {
    constructor(client) {
        super(client, {
            name: "configurar",
            description: "Bloqueie os meus comandos em alguns canais do servidor, permita alguns cargos usarem comandos em todos os canais e troque a mensagem de aviso de bloqueio de comandos!",
            aliases: ['config', 'bloquearcanais', 'blockchannels', 'blockroles'],
            usage: null
        })
    }

    async run(message, args) {
        let guild = await this.client.psql.getGuild(message.guild.id)
        let user = await this.client.psql.getUser(message.guild.id)

        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply({
            content: `❌ ${message.author.toString()}, você precisa ter a permissão de \`Administrador\` dentro desse servidor para alterar essa configuração!`
        })

        let embed = new EmbedBuilder()

            .setColor(this.client.config.colors.green)
            .setTimestamp()
            .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })

            .setTitle(`Configurações do servidor`)
            .setDescription(`${message.author.toString()}, aqui estão algumas das configurações do servidor, você pode alterá-las utilizando os menus de seleção e botôes abaixo!`)
            .setFields([
                {
                    name: `Mensagem de aviso`,
                    value: `\`${guild.warn_message}\``,
                    inline: false
                },
                {
                    name: `Canais permitidos`,
                    value: `${guild.allowed_channels === null || guild.allowed_channels.length === 0 ? user.language === 'pt' ? '`Nenhum!`' : '`None!`' : guild.allowed_channels.map(channel => `<#${channel}>`)}`,
                    inline: false
                },
                {
                    name: `Cargos permitidos`,
                    value: `${guild.allowed_roles === null || guild.allowed_roles.length === 0 ? user.language === 'pt' ? '`Nenhum!`' : '`None!`' : guild.allowed_roles.map(role => `<@&${role}>`)}`,
                    inline: false
                }
            ])
        if (message.guild.iconURL()) embed.setThumbnail(message.guild.iconURL())

        message.reply({
            content: message.author.toString(),
            embeds: [embed],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ChannelSelectMenuBuilder()
                            .setChannelTypes(0)
                            .setCustomId('config_channels_' + message.author.id)
                            .setPlaceholder(`Selecione os canais para permitir!`)
                            .setMinValues(1)
                            .setMaxValues(25)
                            .setDisabled(false)
                    ),
                new ActionRowBuilder()
                    .addComponents(
                        new RoleSelectMenuBuilder()
                            .setCustomId('config_roles_' + message.author.id)
                            .setPlaceholder(`Selecione os cargos para permitir!`)
                            .setMinValues(1)
                            .setMaxValues(15)
                            .setDisabled(false)
                    ),
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('config_message_' + message.author.id)
                            .setDisabled(false)
                            .setEmoji('📋')
                            .setLabel(`Mensagem de aviso`)
                            .setStyle(ButtonStyle.Secondary)
                    ),
            ]
        })
    }
}