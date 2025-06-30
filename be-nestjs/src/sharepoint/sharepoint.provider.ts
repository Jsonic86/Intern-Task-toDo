import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { bootstrap } from 'pnp-auth';
import { sp } from '@pnp/sp-commonjs';
import { PnPLogging } from '@pnp/logging';

export const SHAREPOINT = 'SHAREPOINT';

export const SharePointProvider: Provider = {
    provide: SHAREPOINT,
    inject: [ConfigService],
    useFactory: async (config: ConfigService) => {
        const siteUrl = config.get<string>('SP_SITE');
        const username = config.get<string>('SP_USER');
        const password = config.get<string>('SP_PASS');

        await bootstrap(sp, {
            username,
            password,
            online: true,
        }, siteUrl);

        // Set up the SharePoint base URL after authentication
        sp.setup({
            sp: {
                baseUrl: siteUrl,
            },
        });

        // Optionally enable logging if needed:
        // import { LogLevel } from '@pnp/logging';
        // sp.setup({
        //   sp: {
        //     baseUrl: siteUrl,
        //   },
        //   log: PnPLogging(LogLevel.Info), // or another LogLevel
        // });

        return sp;
    },
};