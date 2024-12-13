export default class Command {
    constructor(client, options) {
        this.client = client
        this.name = options.name
        this.aliases = options.aliases || []
        this.description = options.description || null
        this.usage = options.usage || null
        this.owner = options.owner || false
        this.userPremium = options.userPremium || false
        this.guildPremium = options.guildPremium || false
        this.beta = options.beta || false
    }
}