// Some constants
export const APIVersion = 4
export const TrackInfoVersion = 2
export const TrackInfoVersioned = 1
export const Routes = {
    /** Lavalink Information */
    Info: (version: number) => `/v${version}/info`,
    WebSocket: (version: number) => `/v${version}/websocket`,
    LoadTracks: (version: number) => `/v${version}/loadtracks`,
    DecodeTrack: (version: number) => `/v${version}/decodetrack`,
    DecodeTracks: (version: number) => `/v${version}/decodetracks`,
    // IP Rotation extensions
    RoutePlannerStatus: (version: number) => `/v${version}/routeplanner/status`,
    RoutePlannerFreeAddress: (version: number) => `/v${version}/routeplanner/free/address`,
    RoutePlannerFreeAllAddress: (version: number) => `/v${version}/routeplanner/free/all`,
    Session: (version: number, sesionId: string) => `/v${version}/sessions/${sesionId}`,
    Player: (version: number, sessionId: string, guildId: string) => `/v${version}/sessions/${sessionId}/players/${guildId}`
}

// Structures
import { Client } from "./structures/Client";

export {
    Client
}