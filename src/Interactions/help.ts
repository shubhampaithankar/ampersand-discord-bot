import Client from '../Client'
import { MainInteraction } from '../Classes'
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { EmbedDataType, HelpInteractionType } from '../Types'

export default class HelpInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, {
            type: 1,
            data: new SlashCommandBuilder()
                .setName('help')
                .setDescription('shows help menu')
                .addStringOption((option) => option.setName('query').setDescription('help regarding the command / category').setRequired(false)),
        })
    }

    async run(interaction: ChatInputCommandInteraction, ...args: string[]) {
        try {
            // eslint-disable-next-line prefer-const
            let embedData: EmbedDataType = {
                author: {
                    name: 'Ampersand Bot',
                    iconURL: this.client.user?.avatarURL() || undefined
                },
                color: 'Aqua',
                title: 'Help Command',
                timestamp: Date.now(),
                footer: {
                    text: interaction.member!.user.username
                },
                fields: []
            }
            const query = interaction.options.getString('query')?.toLowerCase()

            const interactions: HelpInteractionType = {}
            this.client.interactions.forEach(interaction => {
                const category = `${interaction.category?.toLowerCase()}`
                if (!Object.prototype.hasOwnProperty.call(interactions, category)) {
                    interactions[category] = []
                }
                interactions[category].push(interaction.data as SlashCommandBuilder)
            })

            const categories = Array.from(new Set(Object.keys(interactions).map(item => item !== '' ? item : 'misc')))

            if (!query) {
                categories.forEach(category => {
                    const commandsString = interactions[category !== 'misc' ? category : ''].map((item) => `\`${item.name}\``).join(' ')
                    embedData.fields!.push({
                        name: this.client.utils.capitalizeString(category),
                        value: commandsString
                    })
                })
            } else {
                const commands: string[] = [] 
                Object.values(interactions).forEach(item => item.forEach(command => commands.push(command.name.toLowerCase()))) as unknown as string[]
                if (commands.includes(query)) {
                    const command = Object.values(interactions).map(item => item.find(command => command.name === query))[0]!
                    embedData.fields!.push({
                        name: 'Name',
                        value: `\`${command.name}\``,
                        inline: true
                    }, {
                        name: 'Description',
                        value: `${command.description}`
                    })
                    const options = command.options.map(option => `\`${option.toJSON().name}\``).join(', ')
                    embedData.fields!.push({
                        name: 'Params',
                        value: options
                    })
                } else if (categories.includes(query)) {
                    const category = query === 'misc' ? '' : query
                    const data = interactions[category]

                    for (const command of data) {
                        embedData.fields!.push({
                            name: command.name,
                            value: `\`${command.description}\``
                        })
                    }

                    embedData.title = `${this.client.utils.capitalizeString(query)} Category`
                }
            }

            const embed = await this.client.utils.createMessageEmbed(embedData)
            if (!embed) throw new Error('There was an error in Help command')

            await interaction.reply({
                embeds: [embed]
            })

            return 
        } catch (error) {
            console.log(error)
        }
    }
}