import { config } from 'dotenv'
import Client from './src/Client'

(() => {
    try {
        config()
        process.removeAllListeners('warning')

        const client = new Client()
        client.initialize()
    } catch (error) {
        console.log(error)
    }
})()