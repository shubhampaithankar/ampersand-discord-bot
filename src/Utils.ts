import BaseClient from './Client'

export class Utils {
    client: BaseClient
    constructor (client: BaseClient) {
        this.client = client
    }
}