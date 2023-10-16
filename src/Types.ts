import Client from './Client'

export type InteractionConfig = {
    name: string
    type: number
    description: string
    options: Array<object> | null
}