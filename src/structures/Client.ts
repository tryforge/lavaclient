import { Client as DiscordClient } from "discord.js";
import { API } from "./API";
import { EventEmitter } from "events"
import { Session } from "./Session";

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
    public readonly sessions = new Map<string, Session>()
    public constructor(public readonly options: ClientOptions) {
        super()
        options = Object.freeze(options)
        this.api = new API(this.options)
    }

    public addClient(client: DiscordClient) {
        if (client.isReady()) {
            return this.createSocket(client.user.id)
        }

        client.once('ready', (client) => this.createSocket(client.user.id))
    }

    private createSocket(userId: string) {
        const socket = new Session({
            userId,
            url: this.options.url,
            password: this.options.password,
        })
        this.sessions.set(userId, socket)

        socket.configureNetworking()
        socket
    }
}