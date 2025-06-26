export const msalConfig = {
  auth: {
    clientId: "197aa42e-b3b5-4d41-8de9-23f0a49bbad3",
    authority: "https://login.microsoftonline.com/8d72c235-dd33-4381-b69c-95c5221f9041",
    redirectUri: "http://localhost:1273", // Đã đúng
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: true,
  },
};

export const loginRequest = {
  scopes: [
    "openid",
    "profile",
    "offline_access"
    // "https://1work.sharepoint.com/.default" // có thể bỏ dòng này nếu không dùng token
  ],
};
