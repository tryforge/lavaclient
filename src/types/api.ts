export type APIError =
{
    timestamp: number
    status: number
    error: string
    trace?: string
    message: string
    path: string
}

// API
export type VoiceState =
{
    sessionId: string
    endpoint: string
    token: string
}

export type UpdatePlayerPayload = 
{
    track?: UpdatePlayerTrack
    position?: number
    endTime?: number
    volume?: number
    paused?: boolean
    filters?: any
    voice?: VoiceState
    noReplace?: boolean
}

export type UpdatePlayerTrack =
{
    encoded?: string
    identifier?: string
    userData?: any
}

// Lavalink

export type Version =
{
    semver: string
    major: number
    minor: number
    patch: number
    preRelease?: string
    build?: string
}

export type Git =
{
    branch: string
    commit: string
    commitTime: number
}

export type Plugin =
{
    name: string
    version: string
}

export type LavalinkInfo =
{
    version: Version
    buildTime: number
    git: Git
    jvm: string
    lavaplayer: string
    sourceManagers: string[]
    filters: string[]
    plugins: Plugin[]
}

// Route planner Objects
export type RoutePlannerType =
    "RotatingIpRoutePlanner" |
    "NanoIpRoutePlanner" |
    "RotatingNanoIpRoutePlanner" |
    "BalancingIpRoutePlanner"
export type IpBlockType = "Inet4Address" | "Inet6Address"
export type FailingAddress =
{
    failingAddress: string
    failingTimestamp: string
    failingTime: string
}

export type IpBlock =
{
    type: IpBlockType
    size: number
}

export type Details =
{
    ipBlock: IpBlock
    failingAddresses: FailingAddress[]
    rotateIndex: number
    ipIndex: number
    currentAddress: string
    currentAddressIndex: string
    blockIndex: string
}

export type RoutePlannerStatus =
{
    class: RoutePlannerType | null,
    details: Details | null
}