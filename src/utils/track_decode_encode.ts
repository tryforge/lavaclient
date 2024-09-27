import type { DataReader, DataWriter } from "@lavacoffee/datarw";
import { Packages } from "./optional-packages";
import { TrackInfo } from "../types/entity";

export function decode<T extends Record<string, unknown>>
(
    track?: string | Uint8Array, 
    decodeTrackDetails?: (reader: DataReader, sourceName: string) => T | undefined
): TrackInfo & T {
    if (Packages["@lavacoffee/datarw"] instanceof Error) {
        const err = Packages["@lavacoffee/datarw"]
        throw err
    }

    if (typeof track === "string") 
        track = Buffer.from(track, "base64")

    const reader = new Packages["@lavacoffee/datarw"].DataReader(track)
    reader.read()
    
    const info: TrackInfo = 
    {
        title: reader.readUTF(),
        author: reader.readUTF(),
        length: reader.readLong(),
        identifier: reader.readUTF(),
        isStream: reader.readBool(),
        url: reader.readUTF(),
        sourceName: reader.readUTF(),
        isSeekable: true,
        position: 0
    }

    if (info.isStream) info.isSeekable = false

    if (typeof decodeTrackDetails === "function") {
        const extended = decodeTrackDetails(reader, info.sourceName)
        Object.assign(info, extended)
    }

    return <TrackInfo & T>info
}