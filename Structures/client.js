import { Client, Collection, Events, GatewayIntentBits } from "discord.js"
import { readdirSync as read } from "fs"

import Database from "../Database/psql.js"
import Utils from "../Utils/utils.js"
import Config from "../Assets/Json/config.json" assert { type: 'json'}
import Logger from "./logger.js"
import Voter from "./voter.js"

class Kingg extends Client {
    constructor() {
        super({
            disableMentions: 'everyone',
            fetchAllMembers: true,
            intents: [
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildMembers
            ],
            sweepers: [
                {
                    messages: {
                        interval: 60,
                        lifetime: 600
                    },
                    users: {
                        interval: 600,
                        lifetime: 2000
                    }
                }
            ]
        })

        this.commands = new Collection()
        this.aliases = new Collection()
        this.interactions = new Collection()
        this.cooldowns = new Collection()
        this.blackjack = new Collection()

        this.voter = new Voter(this)
        this.psql = new Database()
        this.utils = new Utils(this)
        this.config = Config
        this.logger = new Logger(this)
    }

    async initializeClient() {
        await this.loadDatabase()
        await this.loadCommands()
        await this.loadEvents()
        await this.loadInteractions()

        await this.login(process.env.CLIENT_TOKEN)
    }

    async loadDatabase() {
        await this.psql.loadModels()
    }

    async loadCommands() {
        read("./Commands/").forEach(async (dir) => {
            let commands = await read(`./Commands/${dir}`)
            for (let file of commands) {
                let query = (await import(`../Commands/${dir}/${file}`)).default
                let command = new query(this)

                if (command.name) this.commands.set(command.name, command)
                else continue
                if (command.aliases && Array.isArray(command.aliases)) command.aliases.forEach(alias => this.aliases.set(alias, command.name))
            }
        })
    }

    async loadEvents() {
        await read("./Events/").forEach(async (dir) => {
            let events = (await import(`../Events/${dir}`)).default
            let event = new events(this)
            super.on(event.name, (...args) => event.run(...args))
        })
    }

    async loadInteractions() {
        read('./Interactions').forEach(async sub => {
            read('./Interactions/' + sub).forEach(async file => {
                let interaction = (await import('../Interactions/' + sub + '/' + file)).default
                this.interactions.set(interaction.name, interaction)
            })
        })
    }

}

export default Kingg