import { WebSocket } from "ws";
import { EventPacket, Packet, StatsPacket } from "../types/packets";
import { PlayerState } from "../types/packet_payloads";
import EventEmitter from "events";
import { ClientName, Events } from "..";

interface SessionEvents {
    connecting: []
    disconnected: []
    destroyed: []
    ready: [sessionId: string, resumed: boolean]
    stats: [stats: Omit<StatsPacket, 'op'>]
    playerUpdate: [guildId: string, state: PlayerState]
    event: [packet: Omit<EventPacket, 'op'>]
}

interface SessionOptions {
    url: string
    password: string
    userId: string
}

interface SessionState {
    connected: boolean
    interval: NodeJS.Timeout | null
    sessionId?: string
}

/** Lavalink session websockets */
export class Session extends EventEmitter<SessionEvents> {
    #state: SessionState
    #socket: WebSocket
    #status: 
        (typeof Events.Session.Connecting |
        typeof Events.Session.Disconnected |
        typeof Events.Session.Ready |
        typeof Events.Session.Destroyed);
    
    public stats: Omit<StatsPacket, 'op'>
    public constructor(public readonly options: SessionOptions) {
        super()

        this.#state = {
            connected: false,
            interval: null
        }
        this.configureNetworking()
    }

    public get status() { return this.#status }

    public get state() { return this.#state }

    public destroy() {
        this.#status = Events.Session.Destroyed
        this.#state = Object.freeze({
            ...this.#state,
            interval: null,
            connected: false
        })

        if (this.#socket) this.#socket.close(1001)
        this.emit("destroyed")
    }

    public configureNetworking() {
        const Headers = {
            "Authorization": this.options.password,
            "Client-Name": ClientName(this.options.userId),
            "User-Id": this.options.userId
        }
        
        if (this.#state.sessionId) {
            Headers["Session-Id"] = this.#state.sessionId
        }

        this.#socket = new WebSocket(this.options.url, { headers: Headers })
        this.#socket.once("open", this._onOpen.bind(this))
        this.#socket.once("close", this._onClose.bind(this))
        this.#socket.once("error", this._onError.bind(this))
        this.#socket.on("message", this._onMessage.bind(this))
    }

    _onOpen() {
        this.#status = Events.Session.Ready
        this.#state.connected = true
    }

    _onClose() {
        this.#status = Events.Session.Disconnected
        this.#state.connected = false
    }

    _onError() {

    }

    _onMessage(data: Buffer) {
        let packet: Packet
        try { packet = JSON.parse(data.toString("utf-8")) }
        catch {
            console.debug(`failed to parse packet, packet dropped.`)
            return
        }

        switch (packet.op) {
            case "ready": {
                this.#state.sessionId = packet.sessionId
                this.emit("ready", packet.sessionId, packet.resumed)
            }
            break
            case "stats": {
                delete packet['op']
                this.stats = packet
                this.emit("stats", packet)
            }
            break
            case "playerUpdate": {
                this.emit("playerUpdate", packet.guildId, packet.state)
            }
        }
    }
}