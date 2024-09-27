import type { DataReader, DataWriter } from "@lavacoffee/datarw"

type ExportedPackages = {
    "@lavacoffee/datarw": { DataReader: typeof DataReader , DataWriter: typeof DataWriter }
}

function fallbackError(libName: string) {
    return () => new Error(
        `This operation requires the dependency '${libName}'!`
    )
}

const Packages: ExportedPackages = {
    "@lavacoffee/datarw": fallbackError("@lavacoffee/datarw") as any
}

void (async () => {
    for (const libName in Packages) {
        try {
            const lib = await import(libName)
            Packages[libName] = lib.default
        } catch {}
    }
})

export {
    Packages
}