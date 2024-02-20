//compiler super class

class Compiler extends Component {
    /* Globals
    These variables can be used by any part of the compiler */
    public currentProgram: number;

    public sourceCode: string;

    private reachedEOF: boolean = false;
    private caughtError: boolean = false;

    private inDebugMode: boolean = false;

    private _Lexer : Lexer;
    private _Parser : Parser;


    constructor(source: string, enableDebug: boolean) {
        super("Compiler", enableDebug);
        this.inDebugMode = enableDebug;

        this.currentProgram = 0;
        
        this.sourceCode = source;
        //passing the compiler into its own components allows the components to access "global" variables
        this._Lexer = new Lexer(this.sourceCode, this.inDebugMode);
    }

    public compile() {
        var infiniteProtection = 0;
        while (!this.reachedEOF && infiniteProtection < 10) {
            this.currentProgram++;

            //Lexer
            this.info("Lexing program " + this.currentProgram);
            var lexOut = this._Lexer.lex();
            var tokens = lexOut.tokens;
            this.info("Lexer returned " + tokens.length + " tokens with " + lexOut.errors + " errors and " + lexOut.warnings + " warnings\n");
            if (lexOut.errors > 0) {
                this.caughtError = true;
            }
            if (lexOut.EOF) {
                this.reachedEOF = true;
            }

            //Parser
            if (!this.caughtError) {
                //console.log("here");
                this._Parser = new Parser(tokens, this.inDebugMode);
                
                this.info("Parsing program " + this.currentProgram);
                
                var parseOut = this._Parser.parse();

                this.info("Parsing complete with " + parseOut.errors + " errors and " + parseOut.warnings + " warnings\n");
            } else {
                this.err("")
            }
            this.reset();
            infiniteProtection++;
        }
    }

    private reset() {
        this._Lexer.reset();
        this.caughtError = false;
    }
}
