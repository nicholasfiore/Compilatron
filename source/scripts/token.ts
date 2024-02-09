//general token interface to store data about each token being scanned
type Token = {
    name?: string,
    kind: string;
    value?: string;
    line: number;
    position: number;
}
