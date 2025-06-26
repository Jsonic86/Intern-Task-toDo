export interface IFetchClient {
    fetch(url: string, options: RequestInit): Promise<Response>;
}

export class BearerTokenFetchClient implements IFetchClient {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    async fetch(url: string, options?: RequestInit): Promise<Response> {
        const headers = new Headers(options?.headers);
        headers.set("Authorization", `Bearer ${this.token}`);
        headers.set("Accept", "application/json;odata=verbose");
        headers.set("Content-Type", "application/json;odata=verbose");

        return fetch(url, {
            ...options,
            headers,
            credentials: "include",
        });
    }
}