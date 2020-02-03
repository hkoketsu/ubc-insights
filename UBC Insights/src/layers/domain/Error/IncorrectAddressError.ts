export class IncorrectAddressError extends Error {
    constructor(...args: any[]) {
        super(...args);
        Error.captureStackTrace(this, IncorrectAddressError);
    }
}
