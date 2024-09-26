import { 
    GatewayOpcodes,
    type InternalDiscordGatewayAdapterImplementerMethods, 
    type InternalDiscordGatewayAdapterLibraryMethods 
} from "discord.js"

const VoiceStates = new Map<string, any>

export type JoinConfig =
{
    channelId: string
    guildId: string
    selfMute?: boolean
    selfDeaf?: boolean
    adapterCreator: (methods: InternalDiscordGatewayAdapterLibraryMethods) => InternalDiscordGatewayAdapterImplementerMethods
}

export function joinVoiceChannel(config: JoinConfig) {
    if (! config) {
        throw new TypeError(`joinVoiceChannel requires JoinConfig option!`)
    }

    const { channelId, guildId, adapterCreator } = config
    const methods = adapterCreator({
        destroy() {
            VoiceStates.delete(guildId)
        },
        onVoiceStateUpdate(data) {

        },
        onVoiceServerUpdate(data) {

        }
    })

    const voiceChannelPayload =
    {
        op: GatewayOpcodes.VoiceStateUpdate,
        d: {
            channel_id: channelId,
            guild_id: guildId,
            self_mute: Boolean(config.selfMute),
            self_deaf: Boolean(config.selfDeaf)
        }
    }

    methods.sendPayload(voiceChannelPayload)
}