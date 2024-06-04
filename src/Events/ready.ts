import { ActivityType, Events } from 'discord.js'
import { MainEvent } from '../Classes'
import Client from '../Client'

export default class ReadyEvent extends MainEvent {
    constructor (client: Client) {
        super(client, Events.ClientReady, {
            once: true
        })
    }
    run = async () => {
        try {
            console.log(`Bot Online: ${this.client.user?.tag}`)

            console.log(`Up Since: ${new Date(this.client.startTime).toLocaleString('en-IN', { 
                day: '2-digit', 
                month: '2-digit', 
                year: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit', 
                hour12: false, 
                timeZone: 'Asia/Kolkata' 
            })}`)

            this.client.loader.initJTC()

            if (this.client.manager) await this.client.manager.spawn({
                amount: 'auto'
            })
            
            if (this.client.music) this.client.music.init(this.client)

            this.client.user!.setPresence({
                status: 'dnd',
                activities: [
                    {
                        name: `${this.client.guilds.cache.size} Guilds`,
                        type: ActivityType.Competing,
                    },
                    {
                        name: '/invite',
                        type: ActivityType.Listening
                    }
                ]
            })
                  
        } catch (error) {
            console.log('Ready Event Error:\n', error)
        }

    }
}