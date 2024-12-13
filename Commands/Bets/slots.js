import Command from "../../Structures/command.js"

import { EmbedBuilder } from "discord.js"
import { EventEmitter } from "events"

export default class BalanceCommand extends Command {
    constructor(client) {
        super(client, {
            name: "slots",
            description: "Aposte suas moedas em uma caça-níqueis!",
            aliases: ['caça-níqueis', 'slotsmachine', 'caçaniqueis', 'caçaníqueis', 'cacaniqueis'],
            usage: "<valor>"
        })
    }

    async run(message, args) {
        const client = this.client
        const author_data = await this.client.psql.getUser(message.author.id)
        const amount = this.client.utils.formatNumber(args[0], author_data.money, 0, 250_000)
        const premium = await this.client.psql.getUserPremium(message.author.id)

        if (!amount || isNaN(amount) || amount === 0 || amount > 10_000_000_000) return message.reply({
            content: `❌ ${message.author.toString()}, me informe uma quantia válida para apostar!`
        })

        if (author_data.money < amount) return message.reply({
            content: `❌ ${message.author.toString()}, você não tem saldo suficiente para fazer essa aposta!`
        })

        if (amount < 100 || amount > 150_000) return message.reply({
            content: `❌ ${message.author.toString()}, o valor da aposta precisa ser maior que 100 moedas e menor que 150.000!`
        })

        if (author_data.bets >= 30 && !premium || author_data.bets >= 50 && premium) return message.reply({
            content: `❌ ${message.author.toString()}, você atingiu o limite de apostas por hora, tente novamente mais tarde!${premium ? '' : ' (Aumente seu limite para **50** virando **VIP**)'}`
        })

        await this.client.psql.updateUserBets(message.author.id, 1)
        await this.client.psql.updateUserMoney(message.author.id, -amount)

        class Game extends EventEmitter {
            constructor(options = {}) {
                if (!options.slots) options.slots = ['🍇', '🍊', '🍋', '🍌'];

                super()
                this.options = options;
                this.client = client
                this.slot1 = this.slot2 = this.slot3 = 0;
                this.slots = options.slots;
                this.result = null;
            }

            getBoardContent(showResult) {
                let board = '```\n-------------------\n';
                board += `${this.wrap(this.slot1, false)}  :  ${this.wrap(this.slot2, false)}  :  ${this.wrap(this.slot3, false)}\n\n`;
                board += `${this.slots[this.slot1]}  :  ${this.slots[this.slot2]}  :  ${this.slots[this.slot3]} <\n\n`;
                board += `${this.wrap(this.slot1, true)}  :  ${this.wrap(this.slot2, true)}  :  ${this.wrap(this.slot3, true)}\n`;
                board += '-------------------\n';

                // if (showResult) board += `| : :   ${(this.hasWon() ? 'GANHOU ' : 'PERDEU')}   : : |`;
                return (board + '```');
            }

            async startGame() {
                this.slotMachine();

                const embed = new EmbedBuilder()

                    .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })
                    .setColor(this.client.config.colors.default)
                    .setTimestamp()

                    .setTitle('Caça-Níqueis')
                    .setDescription(this.getBoardContent())

                const msg = await message.channel.send({ embeds: [embed] });


                setTimeout(async () => {
                    this.slotMachine();
                    embed.setDescription(this.getBoardContent());

                    this.slotMachine();
                    await msg.edit({ embeds: [embed] });

                    setTimeout(() => {
                        this.gameOver(msg)
                    }, 2000);
                }, 2000);
            }


            gameOver(msg) {
                let slots = {
                    player: message.author,
                    slots: [this.slot1, this.slot2, this.slot3].map(s => this.slots[s]),
                    message: msg
                }

                this.emit('gameOver', { result: (this.hasWon() ? 'win' : 'lose'), ...slots });

                const embed = new EmbedBuilder()

                    .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })
                    .setColor(this.client.config.colors.default)
                    .setTimestamp()

                    .setTitle('Caça-Níqueis')
                    .setDescription(this.getBoardContent(true))
                    .addFields([
                        {
                            name: 'Resultado:',
                            value: this.hasWon() ? `Você ganhou **${amount.toLocaleString()} moedas**!` : `Voce perdeu **${amount.toLocaleString()} moedas**!`
                        }
                    ])

                return msg.edit({ embeds: [embed] });
            }


            slotMachine() {
                this.slot1 = Math.floor(Math.random() * this.slots.length);
                this.slot2 = Math.floor(Math.random() * this.slots.length);
                this.slot3 = Math.floor(Math.random() * this.slots.length);
            }

            hasWon() {
                return (this.slot1 === this.slot2 && this.slot1 === this.slot3);
            }

            wrap(s, add) {
                if (add) return (s + 1 > this.slots.length - 1) ? this.slots[0] : this.slots[s + 1];
                return (s - 1 < 0) ? this.slots[this.slots.length - 1] : this.slots[s - 1];
            }
        }

        const Slots = new Game({
            slots: ['🍇', '🍊', '🍌', '🍎']
        })

        Slots.startGame()
        Slots.on('gameOver', async result => {
            if (result.result == 'lose') {
                let tasks = await this.client.psql.getTasks(message.author.id)

                await this.client.psql.updateTasks(message.author.id, {
                    bets: tasks.bets + 1
                })
                await this.client.psql.createTransaction({
                    source: 19,
                    received_by: message.author.id,
                    given_at: Date.now(),
                    amount: amount
                })

                return result.message.reply({
                    content: `❌ ${message.author}, você perdeu **${amount.toLocaleString()} moedas** no caça-níqueis, que tal tentar novamente?`
                })
            } else {
                let tasks = await this.client.psql.getTasks(message.author.id)

                await this.client.psql.updateTasks(message.author.id, {
                    bets: tasks.bets + 1
                })
                await this.client.psql.updateUserMoney(message.author.id, amount * 2)
                await this.client.psql.createTransaction({
                    source: 19,
                    given_by: message.author.id,
                    given_at: Date.now(),
                    amount: amount
                })

                return result.message.reply({
                    content: `✅ ${message.author}, você ganhou **${amount.toLocaleString()} moedas** no caça-níqueis, parabéns!`
                })
            }
        })
    }
}
