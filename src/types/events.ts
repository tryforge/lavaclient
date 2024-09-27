import { Track } from "./entity"
import { Exception } from "./packet_payloads"

export type EventType = 
    "TrackStartEvent" |
    "TrackEndEvent" | 
    "TrackStuckEvent" |
    "TrackExceptionEvent" |
    "WebsocketClosedEvent"

export type EndReasons = 
    "finished" |
    "loadFailed" |
    "stopped" |
    "replaced" |
    "cleanup"

export type TrackStartEvent =
{
    type: "TrackStartEvent"
    track: Track
}

export type TrackEndEvent =
{
    type: "TrackEndEvent",
    track: Track,
    reason: EndReasons
}

export type TrackStuckEvent =
{
    type: "TrackStuckEvent",
    track: Track,
    thresholdMs: number
}

export type TrackExceptionEvent =
{
    type: "TrackExceptionEvent"
    track: Track
    exception: Exception
}

export type WebsocketClosedEvent =
{
    type: "WebsocketClosedEvent"
    code: number
    reason: string
    byRemote: boolean
}