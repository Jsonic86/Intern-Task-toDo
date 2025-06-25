import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n' // Import i18n để khởi tạo
import React from 'react'
import { RouterProvider } from 'react-router-dom'
import router from './router'
import { Provider } from 'react-redux';
import { store } from './store'
import { PublicClientApplication } from '@azure/msal-browser'
import { msalConfig } from './setup/msalConfig'
import { MsalProvider } from "@azure/msal-react";
const msalInstance = new PublicClientApplication(msalConfig);
async function main() {
  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Provider store={store}>
        <MsalProvider instance={msalInstance}>
          <RouterProvider router={router} />
        </MsalProvider>
      </Provider>
    </React.StrictMode>
  );
}

main();