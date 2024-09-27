import { WebSocket } from "ws";
import { Client } from "./Client";
import { Packet, StatsPacket } from "../types/packets";
import { PlayerState } from "../types/packet_payloads";
import { Track } from "../types/entity";
import { EndReasons } from "../types/events";
import EventEmitter from "events";
import { ClientName, Events } from "..";

interface SessionEvents {
    ready: [sessionId: string, resumed: boolean]
    stats: [stats: Omit<StatsPacket, 'op'>]
    playerState: [state: PlayerState]
    event: []
    trackStart: [track: Track]
    trackEnd: [track: Track, reason: EndReasons]
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
    public constructor(public readonly options: SessionOptions) {
        super()

        this.#state = {
            connected: false,
            interval: null
        }
    }

    public get status() { return this.#status }

    public get state() { return this.#state }
    public set state(value: SessionState) {
        if (! Object.isFrozen(this.#state))
            Object.assign(this.#state, value)
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
    }

    _onOpen() {
        this.#status = Events.Session.Ready
        this.state.connected = true
    }

    _onClose() {
        this.#status = Events.Session.Disconnected
        this.state.connected = false
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
                this.state.sessionId = packet.sessionId
            }
        }
    }
}