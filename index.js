import { ShardingManager } from "discord.js"
import { writeFileSync, existsSync } from "fs"
import chalk from "chalk";

class ShardManager extends ShardingManager {
    constructor() {
        super('./bot.js', {
            totalShards: 2,
            respawn: true,
            token: process.env.CLIENT_TOKEN
        })

        this.on('shardCreate', shard => {
            this.shardCreate(shard)
            shard.on('disconnect', sh => this.shardDisconnect(sh))
            shard.on('death', sh => this.shardDeath(sh))
            shard.on('reconnecting', sh => this.shardReconnecting(sh))
        })
    }

    shardCreate(shard) {
        console.log(chalk.bgBlueBright(`[SHARD ${shard.id || '?'}]`) + ` Shard iniciada`)
    }

    shardDisconnect(shard) {
        console.log(chalk.bgBlueBright(`[SHARD ${shard.id || '?'}]`) + ` Shard desconectada, tentando reconectar...`)
    }

    shardReconnecting(shard) {
        console.log(chalk.bgBlueBright(`[SHARD ${shard.id || '?'}]`) + ` Reiniciando shard`)
    }

    shardDeath(shard) {
        console.log(chalk.bgBlueBright(`[SHARD ${shard.id || '?'}]`) + ` Shard morreu, tentando reconectar...`)
    }

    async connect() {
        this.spawn({ timeout: 60000 }).then(() => console.log(chalk.green('[KINGG]') + ' Todas as shards foram carregadas com sucesso!'))
    }
}

new ShardManager().connect()

process.on('uncaughtException', e => {
    console.log(chalk.red('[FATAL ERROR] ') + e)

    console.log(e)
})

process.on('unhandledRejection', e => {
    console.log(chalk.red('[FATAL ERROR] ') + e)
    console.log(e)
})