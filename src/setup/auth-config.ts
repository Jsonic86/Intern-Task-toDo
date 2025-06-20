import { type Configuration, PublicClientApplication } from "@azure/msal-browser";

export const msalConfig: Configuration = {
    auth: {
        clientId: "197aa42e-b3b5-4d41-8de9-23f0a49bbad3",
        authority: "https://login.microsoftonline.com/8d72c235-dd33-4381-b69c-95c5221f9041",
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: true,
    },
    system: {
        allowNativeBroker: false,
        windowHashTimeout: 60000,
        iframeHashTimeout: 6000,
        loadFrameTimeout: 0
    }
};

export const loginRequest = {
    scopes: [
        "https://1work.sharepoint.com/AllSites.FullControl"
    ],
    prompt: "select_account" as const
};

export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL
let isInitialized = false;
export const initializeMsal = async (): Promise<void> => {
    if (!isInitialized) {
        await msalInstance.initialize();
        isInitialized = true;
        console.log("MSAL initialized successfully");
    }
};