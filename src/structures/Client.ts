import { WebSocket } from "ws";
import { Pool } from "undici"
import { API } from "./API";

export type ClientOptions =
{
    url: string
    password: string
}

export class Client {
    #socket: WebSocket

    public readonly api: API
    public constructor(public readonly options: ClientOptions) {
        options = Object.freeze(options)

        this.api = new API(this)
    }

    private configureSocket() {
        const Headers = {
            "Authorization": this.options.password,
            "Client-Name": ``
        }

        this.#socket = new WebSocket(this.options.url)
    }
}