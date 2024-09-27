import { WebSocket } from "ws";
import { Dispatcher, Pool } from "undici";

// Optional dependencies
import type { DataReader, DataWriter } from '@lavacoffee/datarw'
import type yts from 'yt-search'
import type * as scdl from 'soundcloud.ts'
import { Track, TrackInfo } from "../types";
import { PlayerController, VoiceStatePayload } from "./dataStore";
import EventEmitter from "events";

export const Version = 4
export const Routes = {
    "WebSocket": "/websocket",
    "LoadTracks": "/loadtracks",
    "DecodeTracks": "/decodetracks",
    "Session": (sessionId: string) => `/sessions/${sessionId}`,
    "Player": (sessionId: string, guildId: string) => `/sessions/${sessionId}/players/${guildId}`
}

export const TrackInfoVersioned = 1
export const TrackInfoVersion = 2

// Preparing models
interface Packages {
    "@lavacoffee/datarw": { 
        DataReader: typeof DataReader, 
        DataWriter: typeof DataWriter 
    },
    "yt-search": typeof yts
    "soundcloud.ts": typeof scdl
}
export const Packages: Packages = {
    "@lavacoffee/datarw": void 0,
    "yt-search": void 0,
    "soundcloud.ts": void 0
}

export async function loadModules() {
    Packages["@lavacoffee/datarw"] = (await import("@lavacoffee/datarw")).default
    Packages["yt-search"] = (await import("yt-search")).default
    Packages["soundcloud.ts"] = (await import("soundcloud.ts"))
}

// Lavalink Types
type PacketOp = "ready" | "playerUpdate" | "stats" | "event"
type Packet = { op: PacketOp } & (ReadyPacket | PlayerUpdatePacket | StatsPacket | EventPacket)
type ReadyPacket =
{
    op: "ready"
    resumed: boolean
    sessionId: string
}

type PlayerUpdatePacket =
{
    op: "playerUpdate"
    guildId: string
    state: PlayerState
}

export type PlayerState = 
{
    time: number
    position: number
    connected: boolean
    ping: number
}

type StatsPacket =
{
    op: "stats"
    players: number
    playingPlayers: number
    uptime: number
    memory: OSDeviceMemory
    cpu: OSDeviceCPU
    frameStats: FrameStats
}

type OSDeviceMemory =
{
    free: number
    used: number
    allocation: number
    reserved: number
}

type OSDeviceCPU =
{
    cores: number
    systemLoad: number
    lavalinkLoad: number
}

type FrameStats =
{
    sent: number
    nulled: number
    deficit: number
}

// Event Packets
type EventType = 
    "TrackStartEvent" |
    "TrackEndEvent" | 
    "TrackStuckEvent" |
    "TrackExceptionEvent" |
    "WebsocketClosedEvent"

type EventPacket =
{
    op: "event"
    type: EventType
    guildId: string
} & (TrackStartEvent | TrackEndEvent | TrackExceptionEvent | TrackStuckEvent | WebsocketClosedEvent)

type EndReasons = 
    "finished" |
    "loadFailed" |
    "stopped" |
    "replaced" |
    "cleanup"

type TrackStartEvent =
{
    type: "TrackStartEvent"
    track: Track
}

type TrackEndEvent =
{
    type: "TrackEndEvent",
    track: Track,
    reason: EndReasons
}

type TrackStuckEvent =
{
    type: "TrackStuckEvent",
    track: Track,
    thresholdMs: number
}

type TrackExceptionEvent =
{
    type: "TrackExceptionEvent"
    track: Track
    exception: Exception
}

type Exception =
{
    message: string
    severity: Severity
    cause: string
}

type Severity = "common" | "suspicious" | "fault"

type WebsocketClosedEvent =
{
    type: "WebsocketClosedEvent"
    code: number
    reason: string
    byRemote: boolean
}

// Client Types

interface ClientOptions
{
    url: string
    password: string
}

interface ClientState 
{
    connected: boolean
    players: number,
    sessionId: string,
    userId: string
}

// Player API Payloads
type UpdatePlayerPayload = 
{
    track?: UpdatePlayerTrack
    position?: number
    endTime?: number
    volume?: number
    paused?: boolean
    filters?: any
    voice?: VoiceStatePayload
    noReplace?: boolean
}

type UpdatePlayerTrack =
{
    encoded?: string
    identifier?: string
    userData?: any
}

export interface Client {
    
}

export class Client extends EventEmitter {
    #api: Pool
    #authorization: string
    #net: WebSocket
    #options: ClientOptions
    #state = <ClientState>{
        connected: false,
        players: 0,
        userId: "",
        sessionId: ""
    }
    #players = new Map<string, PlayerController>()
    #updateQueue = new Map<string, UpdatePlayerPayload>()
    public stats: Omit<StatsPacket, "op">
    public constructor(options: ClientOptions) {
        super()
         if (! options) {
            throw new Error("ErrorNew")
         }

         this.#options = structuredClone(options)
         this.#api = new Pool(options.url)
         this.#authorization = options.password
    }

    // Players store
    protected addPlayer() {
        
    }

    request(options: Dispatcher.RequestOptions) {
        return this.#api.request(options)
    }

    loadtracks(query: string) {

    }

    playerUpdate(
        guildId: string, 
        payload: UpdatePlayerPayload,
    ) {
        if (! this.#updateQueue.has(guildId)) {
            this.#updateQueue.set(guildId, payload)

            setImmediate(() => {
                const payload = this.#updateQueue.get(guildId)
                const noReplace = Boolean(payload.noReplace)
                delete payload['noReplace']

                this.#api.request({
                    method: "PATCH",
                    path: `${Version}/${Routes.Player(this.#state.sessionId, guildId)}`,
                    body: JSON.stringify(payload),
                    query: { noReplace }
                })

                this.#updateQueue.delete(guildId)
            })
            return
        }

        const p = this.#updateQueue.get(guildId)
        Object.assign(p, payload)
    }

    // WebSocket Methods

    // Thanks @discordjs/voice for smart names
    // and smart approaches
    private configureNetworking(userId: string) {
        this.#state.userId = userId
        this._createNetSocket()
    }

    private _createNetSocket() {
        const Headers = 
        {
            "Authorization": this.#options.password,
            "Client-Name": `DiscordBot (${this.#options})`,
            "User-Id": this.#state.userId
        }

        if (this.#state.sessionId)
            Headers["Session-Id"] = this.#state.sessionId

        this.#net = new WebSocket(this.#options.url, { headers: Headers })
        this.#net.once("open", this._onReady.bind(this))
        this.#net.on("message", this._onMessage.bind(this))
    }

    private _onReady() {
        Object.assign(this.#state, { connected: true })
    }

    private _onMessage(data: Buffer) {
        let packet: Packet
        try { packet = JSON.parse(data.toString("utf-8"))}
        catch {}

        if (! packet) {
            console.debug(`failed to parse packet, packet dropped`)
            return
        }

        switch (packet.op) {
            case "ready": 
            {
                this.#state["sessionId"] = packet.sessionId
            }
            break
            case "stats":
            {
                this.stats = packet
                delete packet['op']
            }
            break
            case "playerUpdate":
            {

            }
            break
            case "event": {
                switch (packet.type)
                {
                    case "TrackStartEvent":
                    {
                        
                    }
                    break
                }
            }
        }
    }

    get canDecodeInternally() { return Boolean(Packages["@lavacoffee/datarw"]) }
    get canEncodeInternally() { return Boolean(Packages["@lavacoffee/datarw"]) }

    public async decode(encoded: string): Promise<TrackInfo> {
        const internalDecode = this._decodeInternal(encoded)
        if (internalDecode) return internalDecode

        const response = await this.#api.request({
            method: "GET",
            headers: { "Authorization": this.#authorization },
            path: `${Version}/${Routes.DecodeTracks}`,
            query: { "encodedTrack": encoded }
        })

        return await response.body.json() as TrackInfo
    }

    public async decodeMany(encodeds: string[]): Promise<TrackInfo[]> {
        if (Packages["@lavacoffee/datarw"]) {
            return encodeds.map((x) => this._decodeInternal(x))
        }

        const response = await this.#api.request({
            method: "POST",
            headers: { "Authorization": this.#authorization },
            path: `${Version}/${Routes.DecodeTracks}`,
            body: JSON.stringify(encodeds)
        })

        return await response.body.json() as TrackInfo[]
    }

    public decodeSync(encoded: string) {
        if (! Packages["@lavacoffee/datarw"]) {
            throw new Error(`"@lavacoffee/datarw" is required to perform this operation!`)
        }

        return this._decodeInternal(encoded)
    }

    public decodeManySync(encodeds: string[]) {
        if (! Packages["@lavacoffee/datarw"]) {
            throw new Error(`"@lavacoffee/datarw" is required to perform this operation!`)
        }

        return encodeds.map((x) => this._decodeInternal(x))
    }

    // Implementations from @lavacoffee/utils
    // https://github.com/Azusfin/lavacoffee
    // src/utils/trackUtils/decodeTrack.ts

    private _decodeInternal<T extends Record<string, unknown>>
    (
        track?: string | Uint8Array, 
        decodeTrackDetails?: (reader: DataReader, sourceName: string) => T | undefined
    ): TrackInfo & T {
        if (! Packages["@lavacoffee/datarw"]) return

        if (typeof track === "string") 
            track = Buffer.from(track, "base64")

        const reader = new Packages["@lavacoffee/datarw"].DataReader(track)
        reader.read()
        
        const info: TrackInfo = 
        {
            title: reader.readUTF(),
            author: reader.readUTF(),
            length: reader.readLong(),
            identifier: reader.readUTF(),
            isStream: reader.readBool(),
            url: reader.readUTF(),
            sourceName: reader.readUTF(),
            isSeekable: true,
            position: 0
        }

        if (info.isStream) info.isSeekable = false

        if (typeof decodeTrackDetails === "function") {
            const extended = decodeTrackDetails(reader, info.sourceName)
            Object.assign(info, extended)
        }

        return <TrackInfo & T>info
    }

    // Implementations from @lavacoffee/utils
    // https://github.com/Azusfin/lavacoffee
    // src/utils/trackUtils/encodeTrack.ts

    private _encodeInternal<T extends Record<string, unknown>>
    (
        track: TrackInfo & T,
        encodeTrackDetails?: (track: TrackInfo & T, data: DataWriter) => unknown,
        writePosition?: boolean
    ): Uint8Array {
        if (! Packages["@lavacoffee/datarw"]) {
            throw new Error(`"@lavacoffee/datarw" is required to perform this operation!`)
        }

        const writer = new Packages["@lavacoffee/datarw"].DataWriter()
        writer.write(TrackInfoVersion)
        writer.writeUTF(track.title)
        writer.writeUTF(track.author)
        writer.writeLong(track.length)
        writer.writeUTF(track.identifier)
        writer.writeBool(track.isStream)
        writer.writeNullableText(track.url)
        writer.writeUTF(track.sourceName)

        if (typeof encodeTrackDetails === "function") {
            encodeTrackDetails(track, writer)
        }

        if (writePosition) writer.writeLong(0)
        return writer.finish(TrackInfoVersioned)
    }
}