//general token interface to store data about each token being scanned
module TSC {
    export interface Token {
        kind: string;
        value?: string;
        line: number;
        position: number;
    }
}