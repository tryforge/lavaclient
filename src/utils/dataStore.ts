import { 
    APIVoiceState,
    GatewayOpcodes, 
    GatewayVoiceServerUpdateDispatchData, 
    GatewayVoiceStateUpdateData, 
    InternalDiscordGatewayAdapterImplementerMethods, 
    InternalDiscordGatewayAdapterLibraryMethods 
} from "discord.js"
import { Client } from "../structures/Client"

export type JoinVoiceChannelConfig = 
{
    guildId: string
    channelId: string
    selfMute?: boolean
    selfDeaf?: boolean
}

export type JoinConfig = 
{
    guildId: string
    adapterCreator: (methods: InternalDiscordGatewayAdapterLibraryMethods) =>
        InternalDiscordGatewayAdapterImplementerMethods
}

export function createJoinVoiceChannelPayload(config: JoinVoiceChannelConfig) {
    return {
        op: GatewayOpcodes.VoiceStateUpdate,
        d: {
            guild_id: config.guildId,
            channel_id: config.channelId,
            self_mute: Boolean(config.selfMute),
            self_deaf: Boolean(config.selfDeaf)
        }
    }
}

export type VoicePackets =
{
    server: GatewayVoiceServerUpdateDispatchData
    states: Map<string, APIVoiceState>
}

export type VoiceConnection =
{
    guildId: string
    packets: VoicePackets
    destroy(): void
    bind(client: Client): void
    remove(client: Client): void
    addServerPacket(data: GatewayVoiceServerUpdateDispatchData): void
    addStatePacket(data: APIVoiceState): void
}

const voiceConnections = new Map<string, VoiceConnection>()
const voiceMethods = {
    bind(this: VoiceConnection, client: Client) {
        
    },
    remove(this: VoiceConnection, client: Client) {
        
    },
    addServerPacket(this: VoiceConnection, data: GatewayVoiceServerUpdateDispatchData) {
        if (! data.endpoint) {
            delete this.packets['server']
            return
        }
        this.packets.server = data
    },
    addStatePacket(this: VoiceConnection, data: APIVoiceState) {
        if (data.channel_id === null) {
            this.packets.states.delete(data.user_id)
        }
        this.packets.states.set(data.user_id, data)       
    },
    destroy(this: VoiceConnection) {
        this.packets.states.clear()
        voiceConnections.delete(this.guildId)
    }
}

export function joinVoiceChannel(joinConfig: JoinConfig & JoinVoiceChannelConfig) {
    if (voiceConnections.has(joinConfig.guildId)) {
        return voiceConnections.get(joinConfig.guildId)
    }

    const voiceChannelPayload = createJoinVoiceChannelPayload(joinConfig)
    const { guildId,adapterCreator } = joinConfig

    const voiceConnection = {
        guildId: guildId,
        packets: { states: new Map() }
    } as VoiceConnection
    voiceConnection.addServerPacket = voiceMethods.addServerPacket.bind(voiceConnection)
    voiceConnection.addStatePacket = voiceMethods.addStatePacket.bind(voiceConnection)
    voiceConnection.destroy = voiceMethods.destroy.bind(voiceConnection)

    const adapter = adapterCreator({
        destroy() {
            voiceConnection.destroy()
        },
        onVoiceServerUpdate(data) {
            voiceConnection.addServerPacket(data)       
        },
        onVoiceStateUpdate(data) {
            voiceConnection.addStatePacket(data)
        },
    })

    adapter.sendPayload(voiceChannelPayload)
}