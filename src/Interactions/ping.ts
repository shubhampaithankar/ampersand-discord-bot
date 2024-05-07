import Client from '../Client'
import { MainInteraction } from '../Classes'
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

export default class PingInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, {
            type: 1,
            data: new SlashCommandBuilder()
                .setName('ping')
                .setDescription('responds with a message indicating the latency'),
        })
    }

    async run(interaction: ChatInputCommandInteraction, ...args: string[]) {
        const reply = await interaction.reply('Pinging...')
        reply.edit(`Pong! \nLatency is ${reply.createdTimestamp - interaction.createdTimestamp}ms. \nAPI Latency is ${Math.round(this.client.ws.ping)}ms`)
    }
}