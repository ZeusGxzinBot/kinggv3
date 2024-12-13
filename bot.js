import { config } from "dotenv"

import Client from "./Structures/client.js"
import Chalk from "chalk";

const client = new Client()

export default client;

config()
client.initializeClient()
process.env.TZ = 'America/Sao_Paulo'