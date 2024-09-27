import { Client as DiscordClient } from "discord.js";
import { API } from "./API";
import { ClientName } from "..";
import { EventEmitter } from "events"

export type ClientOptions =
{
    url: string
    password: string
}

export type ClientEvents =
{

}

export class Client extends EventEmitter<ClientEvents> {
    public readonly api: API
    public readonly sockets = new Map<string, WebSocket>()
    public constructor(public readonly options: ClientOptions) {
        super()
        options = Object.freeze(options)
        this.api = new API(this)
    }

    public addClient(client: DiscordClient) {

    }

    private configureSocket(userId: string) {
        
    }
}