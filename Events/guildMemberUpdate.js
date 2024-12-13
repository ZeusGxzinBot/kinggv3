import Event from "../Structures/event.js"

export default class GuildMemberUpdateListener extends Event {
    constructor(client) {
        super(client, "guildMemberUpdate")
    }

    async run(old_member, new_member) {
        //     let guild = this.client.guilds.cache.get('930108325834686485')

        //     let member = {
        //         old: new Date(old_member.premiumSince || 0,
        //         new: new_member.premiumSince
        //     }

        //     console.log(member)

        //     if (new_member.guild.id !== guild.id) return;

        //     if (!member.old.premiumSince && member.new.premiumSince) {
        //         await guild.channels.cache.get('1099162578522996766').send({
        //             content: `<:boostup_karol:1045161168160956416> ${new_member.user.toString()}, obrigado por impulsionar meu servidor! Como forma de agradecimento por isso, você ganhou **1.000.000 moedas** e um **VIP Imperial**! \`(O VIP ficará ativo até o dia em que você retirar o impulso do servidor)\``
        //         })
        //     }

        //     if (member.old.premiumSince && member.new.premiumSince) {
        //         await guild.channels.cache.get('1099162578522996766').send({
        //             content: `<:boostup_karol:1045161168160956416> ${new_member.user.toString()}, obrigado por impulsionar meu servidor! Como você já tinha um impulso no servidor e adicionou um novo, estou adicionando mais **2.500.000 moedas no seu saldo**!`
        //         })
        //     }

        //     if (member.old.premiumSince && !member.new.premiumSince) {
        //         await guild.channels.cache.get('1099162578522996766').send({
        //             content: `<:boostup_karol:1045161168160956416> ${new_member.user.toString()}, é uma pena que você deseje não ser mais um impulsionador do servidor, obrigado por esse tempo conosco mesmo assim! você perdeu acesso total ao seu **VIP Imperial**!`
        //         })
        //     }
    }
}