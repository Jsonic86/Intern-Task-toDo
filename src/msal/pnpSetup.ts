import { spfi, SPFI } from "@pnp/sp";
import { BrowserFetchWithRetry, DefaultParse } from "@pnp/queryable";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";

let sp: SPFI;

export const configurePnP = (token: string) => {
    sp = spfi("https://1work.sharepoint.com/sites/intern-data").using(
        BrowserFetchWithRetry(),
        DefaultParse(),
        // Sử dụng custom behavior để thêm headers
        (instance) => {
            instance.on.pre(async function (this: any, url: string, init: RequestInit, result: any) {
                const headers = new Headers(init.headers);
                headers.set("Authorization", `Bearer ${token}`);
                headers.set("Accept", "application/json;odata=verbose");

                init.headers = headers;
                init.credentials = "include";

                return [url, init, result];
            });

            return instance;
        }
    );
};

export const getSp = () => sp;