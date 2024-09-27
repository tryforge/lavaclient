import { 
    GatewayOpcodes, 
    GatewayVoiceServerUpdateDispatchData, 
    GatewayVoiceStateUpdateData, 
    InternalDiscordGatewayAdapterImplementerMethods, 
    InternalDiscordGatewayAdapterLibraryMethods 
} from "discord.js"

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
export type VoicePacket =
{
    server: GatewayVoiceServerUpdateDispatchData
    state: GatewayVoiceStateUpdateData
}

export type VoiceConnection =
{
    packets: VoicePacket
    addServerPacket(data: GatewayVoiceServerUpdateDispatchData): void
    addStatePacket(data: GatewayVoiceStateUpdateData): void
}

const voiceConnections = new Map<string, VoiceConnection>()
function voice_addServerPacket(
    this: VoiceConnection,
    data: GatewayVoiceServerUpdateDispatchData
    ) {
    this.packets.server = data
}

function voice_addStatePacket(
    this: VoiceConnection,
    data: GatewayVoiceStateUpdateData
    ) {
    this.packets.state = data
}

export function joinVoiceChannel(joinConfig: JoinConfig & JoinVoiceChannelConfig) {
    const voiceChannelPayload = createJoinVoiceChannelPayload(joinConfig)
    const { adapterCreator } = joinConfig

    const voiceConnection = { packets: {} } as VoiceConnection
    voiceConnection.addServerPacket = voice_addServerPacket.bind(voiceConnection)
    voiceConnection.addStatePacket = voice_addStatePacket.bind(voiceConnection)

    const adapter = adapterCreator({
        destroy() {

        },
        onVoiceServerUpdate(data) {
            
        },
        onVoiceStateUpdate(data) {
            
        },
    })

    adapter.sendPayload(voiceChannelPayload)
}