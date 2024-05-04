import Client from '../Client'
import { MainInteraction } from '../Classes'
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { EmbedDataType } from '../Types'

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
            const categories = Array.from(
                new Set(this.client.interactions.map(
                    (interaction) => interaction.category && interaction.category !== '' ? interaction.category : 'misc')
                )
            )
            const interactionsArray = this.client.interactions.map(interaction => interaction.data) as SlashCommandBuilder[]
            const names = interactionsArray.map((data) => data.name.toLowerCase())

            const query = interaction.options.getString('query')?.toLowerCase()
            if (query) {
                // eslint-disable-next-line prefer-const
                let embedData: EmbedDataType = {
                    author: {
                        name: interaction.member!.user.username,
                        iconURL: interaction.member!.user.avatar || '',
                    },
                    color: 'Aqua',
                    title: 'Help Command',
                    timestamp: Date.now(),
                    footer: {
                        text: 'Ampersand Discord Bot'
                    },
                    fields: []
                }

                const category = categories.find(item => item.toLowerCase() === query)
                if (category) {
                    embedData.fields!.push({
                        name: category,
                        value: ''
                    })

                    return
                } else if (names.includes(query)) {
                    // embedData.fields!.push({
                    //     name: category,
                    //     value: ''
                    // })

                    return
                }
                
            }

            return 
        } catch (error) {
            console.log(error)
        }
    }
}