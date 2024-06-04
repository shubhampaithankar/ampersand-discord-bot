import Client from '../Client'
import { MainInteraction } from '../Classes'
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

export default class PingInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, {
            type: 1,
            cooldown: 5,
            data: new SlashCommandBuilder()
                .setName('ping')
                .setDescription('responds with a message indicating the latency'),
        })
    }

    run = async (interaction: ChatInputCommandInteraction, ...args: string[]) => {
        try {
            const reply = await interaction.reply('Pinging...')
            await reply.edit(`Pong! \nLatency is ${reply.createdTimestamp - interaction.createdTimestamp}ms. \nAPI Latency is ${Math.round(this.client.ws.ping)}ms`)
        } catch (error: any) {
            console.log('There was an error in Ping command: ', error)
            await interaction.reply(`There was an error \`${error.message}\``)
            return
        }
    }
}