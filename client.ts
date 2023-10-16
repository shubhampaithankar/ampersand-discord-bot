import { config } from 'dotenv'
import Client from './src/Client'

config()

const client = new Client()
client.initialize()