//general token interface to store data about each token being scanned
namespace TSC {
    export type Token = {
        kind: string;
        value?: string;
        line: number;
        position: number;
    }
}