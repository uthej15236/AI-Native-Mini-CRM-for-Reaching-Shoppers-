export declare const sleep: (milliseconds: number) => Promise<unknown>;
export declare const postJsonWithRetry: (url: string, payload: unknown, secret: string, attempts?: number) => Promise<void>;
