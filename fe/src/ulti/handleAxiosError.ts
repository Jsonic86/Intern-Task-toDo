import { isAxiosError } from 'axios';

export function handleAxiosError<T>(error: unknown, customErrorMessage?: string): T {
    let errorMessage = customErrorMessage || 'Unknown Error';

    if (isAxiosError<T>(error)) {
        if (error.response) {
            return error.response.data;
        }

        errorMessage = error.message;
    }

    // eslint-disable-next-line no-console
    console.error(error);

    return {
        success: false,
        message: errorMessage,
        data: null,
    } as any;
}
