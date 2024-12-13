import express from "express";
import chalk from "chalk";
import ms from "ms"

import { Webhook, Api } from "@top-gg/sdk";
import { EmbedBuilder, WebhookClient } from "discord.js"

class VoteReceiver {
    constructor(client) {
        this.client = client
        this.app = express()
        this.webhook = new Webhook("password")
        this.api = new Api('api key')
    }

    async initServer(port) {
        this.api.postStats({
            serverCount: 1400
        })

        this.app.post("/votes", this.webhook.listener(async (vote) => {
            await this.client.psql.updateUserMoney(vote.user, 50_000)
            await this.client.psql.updateUserVotes(vote.user, 1)
            await this.client.psql.updateCooldowns(vote.user, 'vote', Date.now() + ms('12h'))
            await this.client.psql.updateTasks(vote.user, {
                vote: true
            })
            try {
                await this.client.guilds.cache.get('930108325834686485').members.fetch(vote.user).then(x => x.roles.add('1156708763382857748'))
            } catch (err) {
                console.log(chalk.red(`[TOP.GG]`) + ` Não consegui adicionar o cargo ao usuário (${vote.user}}!`)
            }

            if (!await this.client.psql.getUserPremium(vote.user)) await this.client.psql.updateUserPremium(vote.user, ms('45m'))
            let user = await this.client.users.fetch(vote.user)

            let webhook = new WebhookClient({
                url: "https://discord.com/api/webhooks/1113864964147519619/fSijdNTF9p1FxhdW_xWYab42Ig-CRh1dZCB5p-NEhqLAAGg8zk2RhCO_nkvL05E2tIGN"
            })

            let embed = new EmbedBuilder()

                .setColor(this.client.config.colors.green)
                .setTimestamp()
                .setFooter({ text: user.tag, iconURL: user.displayAvatarURL() })
                .setDescription(`<@${vote.user}>, obrigado por votar em mim!\nPara te recompensar por votar em mim, vou lhe dar alguns presentes!`)

                .setFields([
                    {
                        name: `Presentes`,
                        value: `- **45 minutos de VIP**\n- **50.000 moedas**\n- Insígnia temporária no perfil! (<:kingg_vote:1146877176432566442>)\n- Cargo no servidor oficial!`,
                        inline: true
                    }
                ])

            webhook.send({
                content: `<@${vote.user}>!`,
                username: 'Votos (top.gg)',
                embeds: [embed]
            })
        }))

        this.app.listen(port, () => {
            console.log(`${chalk.greenBright('[APP]')} WebHook conectado e funcionando! (${port})`)
        })
    }
}

export default VoteReceiver
