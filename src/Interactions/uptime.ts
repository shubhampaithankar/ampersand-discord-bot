import Client from '../Client'
import { MainInteraction } from '../Classes'
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import moment from 'moment'

export default class PingInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, {
            type: 1,
            data: new SlashCommandBuilder()
                .setName('uptime')
                .setDescription('how long the bot has been running since it was last started'),
        })
    }

    async run(interaction: ChatInputCommandInteraction, ...args: string[]) {
        const uptime = moment.duration(Date.now() - this.client.startTime)
        const formattedUptime = `${uptime.days()}d ${uptime.hours()}h ${uptime.minutes()}m ${uptime.seconds()}s`

        await interaction.reply(`**Uptime:** \`${formattedUptime}\``)
    }
}