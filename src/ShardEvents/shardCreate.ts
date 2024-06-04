import { Shard } from 'discord.js'
import Client from '../Client'
import { MainShardEvent } from '../Classes'

export default class ShardCreateEvent extends MainShardEvent {
    constructor (client: Client) {
        super(client, 'shardCreate')
    }
    async run(shard: Shard) {
        // console.log(message.content)
    }
}