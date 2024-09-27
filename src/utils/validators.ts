import type { ClientOptions } from "../structures/Client";

const Errors = {
    "MissingClientOptions": new Error(`Client requires 'options' to be passed in the parameter!`),
    "MissingClientOptions.url": new Error(`options.url is required inside options`),
    "MissingClientOptions.password": new Error(`options.password is required inside options!`),
    "InvalidClientOptions.url": new Error(`options.url must be non-empty string!`),
    "InvalidClientOptions.port": new Error(`options.port must be a number!`),
    "InvalidClientOptions.password": new Error(`options.port must be a non-empty string!`),
}

export function validateClientOptions(options: ClientOptions) {
    for (const key in options) {
        
    }
}