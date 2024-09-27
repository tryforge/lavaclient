import { 
    EventType, 
    TrackEndEvent, 
    TrackExceptionEvent, 
    TrackStartEvent, 
    TrackStuckEvent, 
    WebsocketClosedEvent 
} from "./events"
import type { 
    FrameStats, 
    OSDeviceCPU, 
    OSDeviceMemory, 
    PlayerState 
} from "./packet_payloads"

export type PacketOp = "ready" | "playerUpdate" | "stats" | "event"
export type Packet = { op: PacketOp } & (ReadyPacket | PlayerUpdatePacket | StatsPacket | EventPacket)
export type ReadyPacket =
{
    op: "ready"
    resumed: boolean
    sessionId: string
}

export type PlayerUpdatePacket =
{
    op: "playerUpdate"
    guildId: string
    state: PlayerState
}

export type StatsPacket =
{
    op: "stats"
    players: number
    playingPlayers: number
    uptime: number
    memory: OSDeviceMemory
    cpu: OSDeviceCPU
    frameStats: FrameStats
}

export type EventPacket =
{
    op: "event"
    type: EventType
    guildId: string
} & (TrackStartEvent | TrackEndEvent | TrackExceptionEvent | TrackStuckEvent | WebsocketClosedEvent)