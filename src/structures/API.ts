import { Dispatcher, Pool } from 'undici'
import { APIVersion, Routes } from '..';
import type { APIError, LavalinkInfo, RoutePlannerStatus } from "../types/api";

type APIOptions =
{
    url: string
    password: string
}

export class API {
    #api: Pool
    options: WeakRef<APIOptions>
    public constructor(options: APIOptions) {
        this.#api = new Pool(options.url)
        this.options = new WeakRef(options)
    }

    async request<T>(options: Dispatcher.RequestOptions): Promise<T | APIError> {
        const config = this.options.deref()
        if (! config) {
            throw new Error(`Missing options!`)
        }
        Object.assign(options, { headers: { 'Authorization': config.password } })

        return await (await this.#api.request(options)).body.json() as any
    }

    async getInfo() {
        return await this.request<LavalinkInfo>({
            method: "GET",
            path: Routes.Info(APIVersion)
        })
    }

    async getRouteplannerStatus() {
        return await this.request<RoutePlannerStatus>({
            method: "GET",
            path: Routes.RoutePlannerStatus(APIVersion)
        }) as RoutePlannerStatus
    }
}