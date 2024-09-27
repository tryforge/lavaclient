export type PlayerState = 
{
    time: number
    position: number
    connected: boolean
    ping: number
}

export type OSDeviceMemory =
{
    free: number
    used: number
    allocation: number
    reserved: number
}

export type OSDeviceCPU =
{
    cores: number
    systemLoad: number
    lavalinkLoad: number
}

export type FrameStats =
{
    sent: number
    nulled: number
    deficit: number
}

export type Severity = "common" | "suspicious" | "fault"

export type Exception =
{
    message: string
    severity: Severity
    cause: string
}