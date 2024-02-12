//compiler super class

class Compiler extends Component {
    /* Globals
    These variables can be used by any part of the compiler */
    public currentProgram: number;

    public sourceCode: string;

    private reachedEOF: boolean = false;
    private caughtError: boolean = false;

    private _Lexer : Lexer;


    constructor(source: string) {
        super("Compiler");
        this.currentProgram = 0;
        
        this.sourceCode = source;
        //passing the compiler into its own components allows the components to access "global" variables
        this._Lexer = new Lexer(this.sourceCode);
    }

    public compile() {
        while (!this.reachedEOF) {
            this.currentProgram++;
            this.info("Lexing program " + this.currentProgram);
            var lexOut = this._Lexer.lex();
            var tokens = lexOut.tokens;
            this.info("Lexer returned " + tokens.length + " tokens with " + lexOut.errors + " errors and " + lexOut.warnings + " warnings");
            if (lexOut.errors > 0) {
                this.caughtError = true;
            }
            if (lexOut.EOF) {
                this.reachedEOF = true;
            }
            this.reset();
        }
    }

    private reset() {
        this._Lexer.reset();
        this.caughtError = false;
    }
}
