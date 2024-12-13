import Command from "../../Structures/command.js"

import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js"

import ascii from "ascii-table";
import ms from 'ms'

export default class ShardsCommand extends Command {
    constructor(client) {
        super(client, {
            name: "shards",
            description: "Comando restrito!",
            aliases: ['sh'],
            owner: true
        })
    }

    async run(message, args) {
        let table = new ascii(`SHARDS`),
            unit = ["", "K", "M", "G", "T", "P"];

        table.setHeading("ID", "Uptime", "Ping", "Usage", "Servers", "Status");

        table.setAlign(0, ascii.CENTER);
        table.setAlign(1, ascii.CENTER);
        table.setAlign(2, ascii.CENTER);
        table.setAlign(3, ascii.CENTER);
        table.setAlign(4, ascii.CENTER);
        table.setAlign(5, ascii.CENTER);

        table.setBorder("|", "-", "+", "+");

        let uptime = await this.client.shard.broadcastEval(c => c.uptime),
            ping = await this.client.shard.broadcastEval(c => Math.round(c.ws.ping)),
            ram = await this.client.shard.broadcastEval(c => process.memoryUsage().rss),
            guilds = await this.client.shard.broadcastEval(c => c.guilds.cache.size)

        let status = {
            0: 'FUNCIONANDO',
            1: 'CONECTANDO',
            2: 'RECONECTANDO',
            3: 'AUSENTE',
            4: '?',
            5: 'DESCONECTADA',
            6: 'ESPERANDO POR SERVIDORES',
            7: 'IDENTIFICANDO',
            8: 'RETOMANDO'
        }

        let bytesToSize = (input, precision) => {
            let index = Math.floor(Math.log(input) / Math.log(1024));
            if (unit >= unit.length) return input + "B";
            return ((input / Math.pow(1024, index)).toFixed(precision) + " " + unit[index] + "B");
        }

        for (let i = 0; i < this.client.shard.count; i++) {
            table.addRow("#" + i,
                ms(uptime[i] || 0),
                "~" + Math.round(ping[i]) + "ms",
                bytesToSize(ram[i], 2),
                guilds[i].toLocaleString('pt'),
                status[this.client.ws.status])
        }

        let botGuilds = guilds.reduce((prev, val) => prev + val),
            ramTotal = ram.reduce((prev, val) => prev + val),
            pingG = ping.reduce((prev, val) => prev + val),
            media = pingG / this.client.shard.count;

        table.addRow("_______", "_______", "_______", "_______", "_______", "_______");

        table.addRow(
            "TOTAL",
            "-",
            "~" + Math.round(media) + "ms",
            bytesToSize(ramTotal, 2),
            botGuilds.toLocaleString('pt'),
            "-"
        );

        message.reply({
            content: `\`\`\`prolog\n${table.toString()}\n\`\`\``
        })
    }
}