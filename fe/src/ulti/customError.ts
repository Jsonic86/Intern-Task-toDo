class CustomError extends Error {
    constructor(message: string = 'Unknown Error Occurred') {
        super(message);

        Object.setPrototypeOf(this, CustomError.prototype);

        if ((Error as any).captureStackTrace) {
            (Error as any).captureStackTrace(this, CustomError);
        }
    }
}

export { CustomError };