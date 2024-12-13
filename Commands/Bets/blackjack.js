import Command from "../../Structures/command.js"

import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, MessageCollector } from "discord.js"

export default class BjCommand extends Command {
    constructor(client) {
        super(client, {
            name: "blackjack",
            description: "Aposta contra o seu oponente (máquina) em um vinte-e-um!",
            aliases: ['bj', '21', 'vinteeum', 'vinteum'],
            usage: '<quantia>'
        })
    }

    async run(message, args) {
        let data = await this.client.psql.getUser(message.author.id)
        let premium = await this.client.psql.getUserPremium(message.author.id)
        let amount = this.client.utils.formatNumber(args[0], data.money, 0, 200_000)
        let block = this.client.blackjack.get(message.author.id)

        let buttons = (stts) => [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Success)
                        .setLabel('Comprar')
                        .setEmoji("💸")
                        .setCustomId("bj21_buy")
                        .setDisabled(stts),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Secondary)
                        .setLabel('Passar')
                        .setEmoji("🏁")
                        .setCustomId("bj21_pass")
                        .setDisabled(stts)
                )
        ]

        const client = this.client

        if (!amount) return message.reply({
            content: `❌ ${message.author.toString()}, me informe uma quantia válida para apostar!`
        })

        if (isNaN(amount) || amount < 20 || amount > 200_000) return message.reply({
            content: `❌ ${message.author.toString()}, me informe uma quantia válida para apostar!`
        })

        if (amount > data.money) return message.reply({
            content: `❌ ${message.author.toString()}, você não tem saldo suficiente para fazer essa aposta!`
        })

        if (block?.isBlock == true) return message.reply({
            content: `❌ ${message.author.toString()}, você já tem um jogo ativo atualmente, termine-o primeiro para iniciar um novo!`
        })

        if (data.bets >= 30 && !premium || data.bets >= 50 && premium) return message.reply({
            content: `❌ ${message.author.toString()}, você atingiu o limite de apostas por hora, tente novamente mais tarde!${premium ? '' : ' (Aumente seu limite para **50** virando **VIP**)'}`
        })

        await this.client.psql.updateUserBets(message.author.id, 1)
        client.blackjack.set(message.author.id, { isBlock: true })

        let numCardsPulled = 0
        let gameOver = false

        let player = {
            cards: [],
            score: 0
        }
        let dealer = {
            cards: [],
            score: 0
        }

        function getCardsamount(a) {
            let cardArray = [],
                sum = 0,
                i = 0,
                dk = 10.5,
                doubleking = "QQ",
                aceCount = 0
            cardArray = a
            for (i; i < cardArray.length; i += 1) {
                if (cardArray[i].rank === "J" || cardArray[i].rank === "Q" || cardArray[i].rank === "K") {
                    sum += 10
                } else if (cardArray[i].rank === "A") {
                    sum += 11
                    aceCount += 1
                } else if (cardArray[i].rank === doubleking) {
                    sum += dk
                } else {
                    sum += cardArray[i].rank
                }
            }
            while (aceCount > 0 && sum > 21) {
                sum -= 10
                aceCount -= 1
            }
            return sum
        }

        let deck = {
            deckArray: [],
            initialize: function () {
                let suitArray, rankArray, s, r, n;
                suitArray = ["Paus", "Ouros", "Copas", "Espadas"]
                rankArray = [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"]
                n = 13
                for (s = 0; s < suitArray.length; s += 1) {
                    for (r = 0; r < rankArray.length; r += 1) {
                        this.deckArray[s * n + r] = {
                            rank: rankArray[r],
                            suit: suitArray[s]
                        }
                    }
                }
            },
            shuffle: function () {
                let temp, i, rnd;
                for (i = 0; i < this.deckArray.length; i += 1) {
                    rnd = Math.floor(Math.random() * this.deckArray.length)
                    temp = this.deckArray[i]
                    this.deckArray[i] = this.deckArray[rnd]
                    this.deckArray[rnd] = temp
                }
            }
        }

        deck.initialize()
        deck.shuffle()

        let msgEmbed = await message.reply({ content: `🃏 Embaralhando as cartas... (aguarde)` })

        async function bet(outcome) {
            if (outcome === "win") {
                await client.psql.updateUserMoney(message.author.id, amount)
                await client.psql.createTransaction({
                    source: 13,
                    received_by: message.author.id,
                    given_at: Date.now(),
                    amount: BigInt(amount)
                })
                message.reply({ content: `✅ ${message.author.toString()} você ganhou **${amount.toLocaleString()} moedas** 🪙!` })
                client.blackjack.set(message.author.id, { isBlock: false })
            }
            if (outcome === "lose") {
                await client.psql.updateUserMoney(message.author.id, -amount)
                await client.psql.createTransaction({
                    source: 13,
                    given_by: message.author.id,
                    given_at: Date.now(),
                    amount: BigInt(amount)
                })
                message.reply({ content: `❌ ${message.author.toString()}, você perdeu **${amount.toLocaleString()} moedas** 🪙!` })
                client.blackjack.set(message.author.id, { isBlock: false })
            }

            let tasks = await client.psql.getTasks(message.author.id)

            await client.psql.updateTasks(message.author.id, {
                bets: tasks.bets + 1
            })
        }

        function resetGame() {
            numCardsPulled = 0
            player.cards = []
            dealer.cards = []
            player.score = 0
            dealer.score = 0
            deck.initialize()
        }

        async function endMsg(title, msg, dealerC) {
            let cardsMsg = ""
            player.cards.forEach(function (card) {
                cardsMsg += " | " + card.rank.toString();
                if (card.suit == "Copas") cardsMsg += ":hearts:"
                if (card.suit == "Ouros") cardsMsg += ":diamonds:"
                if (card.suit == "Espadas") cardsMsg += ":spades:"
                if (card.suit == "Paus") cardsMsg += ":clubs:"
                cardsMsg
            });
            cardsMsg += " --> " + player.score.toString()

            let dealerMsg = ""
            if (!dealerC) {
                dealerMsg = dealer.cards[0].rank.toString();
                if (dealer.cards[0].suit == "Copas") dealerMsg += ":hearts:"
                if (dealer.cards[0].suit == "Ouros") dealerMsg += ":diamonds:"
                if (dealer.cards[0].suit == "Espadas") dealerMsg += ":spades:"
                if (dealer.cards[0].suit == "Paus") dealerMsg += ":clubs:"
                dealerMsg
            } else {
                dealerMsg = "";
                dealer.cards.forEach(function (card) {
                    dealerMsg += " | " + card.rank.toString()
                    if (card.suit == "Copas") dealerMsg += ":hearts: "
                    if (card.suit == "Ouros") dealerMsg += ":diamonds:"
                    if (card.suit == "Espadas") dealerMsg += ":spades:"
                    if (card.suit == "Paus") dealerMsg += ":clubs:"
                    dealerMsg
                })
                dealerMsg += " --> " + dealer.score.toString()
            }

            const gambleEmbed = new EmbedBuilder()

                .setFooter({ text: '@' + message.author.username, iconURL: message.author.displayAvatarURL() })
                .setColor(client.config.colors.default)
                .setTimestamp()

                .setTitle('Mesa de jogo')
                .addFields([
                    {
                        name: 'Suas cartas',
                        value: cardsMsg.replace('| ', ''),
                        inline: true
                    },
                    {
                        name: 'Cartas do oponente',
                        value: dealerMsg.replace('| ', ''),
                        inline: true
                    },
                    {
                        name: title,
                        value: msg
                    }
                ])

            msgEmbed?.edit({ content: message.author.toString(), embeds: [gambleEmbed], components: gameOver ? [] : buttons(false) })
        }

        async function endGame() {
            if (player.score === 21) {
                bet('win')
                gameOver = true
                await endMsg('Você ganhou', `> Você tem 21 pontos e por isso ganhou automáticamente, você ganhou **${amount.toLocaleString()}** moedas!`, true)
                return
            }
            if (player.score > 21) {
                bet('lose')
                gameOver = true
                await endMsg('Você perdeu', `> Você passou dos 21 pontos e por isso perdeu, você perdeu **${amount.toLocaleString()}** moedas!`, true)
                return
            }
            if (dealer.score === 21) {
                bet('lose')
                gameOver = true
                await endMsg('Você perdeu', `> O seu oponente atingiu 21 pontos, você perdeu **${amount.toLocaleString()}** moedas!`, true)
                return
            }
            if (dealer.score > 21) {
                bet('win')
                gameOver = true
                await endMsg('Você ganhou', `> O seu oponente passou dos 21 pontos, você ganhou **${amount.toLocaleString()}**`, true)
                return
            }
            if (dealer.score >= 17 && player.score > dealer.score && player.score < 21) {
                bet('win')
                gameOver = true
                await endMsg('Você ganhou', `> Você ganhou a partida contra seu oponente por obter uma pontuação maior que a dele, você ganhou **${amount.toLocaleString()}** moedas.`, true)
                return
            }
            if (dealer.score >= 17 && player.score < dealer.score && dealer.score < 21) {
                bet('lose');
                gameOver = true
                await endMsg('Você perdeu', `> O seu oponente obteve uma pontuação maior que a sua e por isso ganhou, você perdeu **${amount.toLocaleString()}** moedas.`, true)
                return
            }
            if (dealer.score >= 17 && player.score === dealer.score && dealer.score < 21) {
                gameOver = true
                await endMsg('Houve um empate', `> Você e o seu oponente empataram, suas **${amount.toLocaleString()}** moedas foram devolvidas.`, true)
                client.blackjack.set(message.author.id, { isBlock: false })
                return
            }
            loop()
        }

        function dealerDraw() {

            dealer.cards.push(deck.deckArray[numCardsPulled])
            dealer.score = getCardsamount(dealer.cards)
            numCardsPulled += 1
        }

        function newGame() {
            hit()
            hit()
            dealerDraw()
            endGame()
        }

        function hit() {
            player.cards.push(deck.deckArray[numCardsPulled])
            player.score = getCardsamount(player.cards)

            numCardsPulled += 1
            if (numCardsPulled > 2) {
                endGame()
            }
        }

        function stand() {
            while (dealer.score < 17) {
                dealerDraw()
            }
            endGame()
        }

        newGame()
        async function loop() {
            if (gameOver) return

            endMsg('Como jogar?', `> Use os botões abaixo para jogar: \`\`comprar\`\` para comprar e \`\`passar\`\` para passar a vez! Lembre-se, esse jogo está valendo **${amount.toLocaleString()}**.`, false)

            let collector = msgEmbed?.createMessageComponentCollector({
                filter: (x) => x.user.id === message.author.id,
                idle: 60000
            })

            collector.on("collect", async (int) => {
                await int.deferUpdate().catch(() => { })
                data = await client.psql.getUser(int.user.id)

                if (int.user.id !== message.author.id) return
                if (data.money < amount) return;

                collector.stop('s')

                if (int.customId == 'bj21_buy') {
                    hit()
                    return
                } else if (int.customId === 'bj21_pass') {
                    stand()
                    return
                }
            })

            collector.on("end", async (c, m) => {
                if (m != 's') {
                    await msgEmbed.edit({ components: [] }).catch(() => { })
                    stand()
                    client.blackjack.set(message.author.id, { isBlock: false })
                }
            })
        }

    }
}