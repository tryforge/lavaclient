import { 
    GatewayOpcodes,
    type InternalDiscordGatewayAdapterImplementerMethods, 
    type InternalDiscordGatewayAdapterLibraryMethods 
} from "discord.js"
import { Client, Routes } from "./client"
import { Track, TrackInfo } from "../types"
import { Dispatcher } from "undici"

// Constants

// Types
export type JoinVoiceChannelConfig =
{
    channelId: string
    guildId: string
    selfMute?: boolean
    selfDeaf?: boolean
}

export type JoinConfig =
{
    guildId: string,
    channelId: string,
    adapterCreator: (methods: InternalDiscordGatewayAdapterLibraryMethods) => InternalDiscordGatewayAdapterImplementerMethods
};

export type VoiceStatePayload =
{
    token: string
    endpoint: string
    sessionId: string
}

export type PlayerState =
{
    connected: boolean
    volume: number
    position: number
    
    playingTrack: string | null
    adapter: InternalDiscordGatewayAdapterImplementerMethods
}

// Stores
const voiceStates = new Map<string, VoiceStatePayload>()
const playerStates = new Map<string, PlayerState>()

function createJoinVoiceChannelPayload(joinConfig: JoinVoiceChannelConfig) {
    return {
        op: GatewayOpcodes.VoiceStateUpdate,
        d: {
            self_mute: Boolean(joinConfig.selfMute),
            self_deaf: Boolean(joinConfig.selfDeaf),
            channel_id: joinConfig.channelId,
            guild_id: joinConfig.guildId
        }
    }
}

export function getOrCreateVoiceState(guildId: string): VoiceStatePayload {
    if (voiceStates.has(guildId)) return voiceStates.get(guildId)

    const state = { endpoint: "", token: "", sessionId: "" }
    voiceStates.set(guildId, state)
    return state
}

export type PlayerController =
{
    guildId: string
    destroy(): void

    // Lavalink api methods
    play(encoded: string): void
    play(track: Track): void
    play(track: string | Track): void
    resume(): void
    pause(): void
    seek(positionInSeconds: number): void
    volume(decibel: number): void
}

export function createPlayerController(client: Client, joinConfig: JoinConfig) {
    const { guildId, adapterCreator } = joinConfig
    const playerController = {
        guildId,
        destroy() {
            const { adapter } = playerStates.get(guildId)
            const voiceChannelPayload = createJoinVoiceChannelPayload({
                guildId, channelId: null
            })
            
            adapter.sendPayload(voiceChannelPayload)
            adapter.destroy()
            voiceStates.delete(guildId)
            playerStates.delete(guildId)
        },

        // Lavalink API Methods
        play(track: string | Track) {
            const encoded = typeof track === "string" ? track : track.encoded
            client.playerUpdate(guildId, { track: {encoded} })
        },
        volume(decibel: number) {
            client.playerUpdate(guildId, { volume: decibel * 100 })
        },
        seek(positionInSeconds: number) {
            client.playerUpdate(guildId, { position: positionInSeconds * 1000 })
        },
        pause() {
            client.playerUpdate(guildId, { paused: true })
        },
        resume() {
            client.playerUpdate(guildId, { paused: false })
        }
    }

    return playerController
}

export function joinVoiceChannel(joinConfig: JoinVoiceChannelConfig & JoinConfig) {
    const voiceChannelPayload = createJoinVoiceChannelPayload(joinConfig)
    const { guildId, adapterCreator } = joinConfig
    
    const methods = adapterCreator({
        destroy() { voiceStates.delete(guildId); playerStates.delete(guildId) },
        onVoiceServerUpdate(data) {
            Object.assign(
                getOrCreateVoiceState(guildId),
                { endpoint: data.endpoint, token: data.token }
            )
        },
        onVoiceStateUpdate(data) {
            Object.assign(
                getOrCreateVoiceState(guildId),
                { sessionId: data.session_id }
            )
        },
    })

    methods.sendPayload(voiceChannelPayload)

    return 
}