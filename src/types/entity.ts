export type Track<UserData = unknown> =
{
    encoded: string
    info: TrackInfo
    pluginInfo: any
    userData: UserData
}

export type TrackInfo =
{
    identifier: string
    isSeekable: boolean
    author: string
    length: number
    isStream: boolean
    position: number
    title: string
    url: string
    artworkUrl?: string
    isrc?: string
    sourceName: string
}

export type PlaylistInfo =
{
    name: string
    selectedTrack: number
}