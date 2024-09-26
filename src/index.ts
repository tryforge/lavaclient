import { 
    GatewayOpcodes,
    type InternalDiscordGatewayAdapterImplementerMethods, 
    type InternalDiscordGatewayAdapterLibraryMethods 
} from "discord.js"
import { Client, Routes } from "./core/client"
import { Track, TrackInfo } from "./types"

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

function getOrCreateVoiceState(guildId: string): VoiceStatePayload {
    if (voiceStates.has(guildId)) return voiceStates.get(guildId)

    const state = { endpoint: "", token: "", sessionId: "" }
    voiceStates.set(guildId, state)
    return state
}

export function createPlayerController(client: Client, guildId: string) {
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

        play(track: string | Track) {
            const encoded = typeof track === "string" ? track : track.encoded

            return client.playerUpdate(guildId, {
                track: { encoded }
            }, true)
        },

        volume(decibel: number) {
            return client.playerUpdate(guildId, { volume: decibel * 100 })
        },
        seek(positionInSeconds: number) {
            return client.playerUpdate(guildId, { position: positionInSeconds * 1000 })
        },
        pause() {
            return client.playerUpdate(guildId, { paused: true })
        },
        resume() {
            return client.playerUpdate(guildId, { paused: false })
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
}