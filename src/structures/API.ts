import { Dispatcher, Pool } from 'undici'
import { Client } from "./Client";
import type { APIError, LavalinkInfo, RoutePlannerStatus } from "../types/api";
import { APIVersion, Routes } from '..';

export class API {
    #api: Pool
    public constructor(public readonly client: Client) {
        this.#api = new Pool(client.options.url)
    }

    async request(options: Dispatcher.RequestOptions) {
        return await (await this.#api.request(options)).body.json()
    }

    async getInfo(): Promise<LavalinkInfo | APIError> {
        return await this.request({
            method: "GET",
            path: Routes.Info(APIVersion)
        }) as LavalinkInfo
    }

    async getRouteplannerStatus(): Promise<RoutePlannerStatus | APIError> {
        return await this.request({
            method: "GET",
            path: Routes.RoutePlannerStatus(APIVersion)
        }) as RoutePlannerStatus
    }
}