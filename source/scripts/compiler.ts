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
    private _Analyzer : SemanticAnalyzer;


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

            /* Lexer */
            this.info("Lexing program " + this.currentProgram);
            var lexOut = this._Lexer.lex();
            var tokens = lexOut.tokens;
            
            if (lexOut.errors > 0) {
                this.info("Lexer failed with " + lexOut.errors + " errors and " + lexOut.warnings + " warnings\n");
                this.caughtError = true;
            } else {
                this.info("Lexer returned " + tokens.length + " tokens with " + lexOut.errors + " errors and " + lexOut.warnings + " warnings\n");
            }
            if (lexOut.EOF) {
                this.reachedEOF = true;
            }

            /* Parser */
            if (!this.caughtError) {
                //console.log("here");
                this._Parser = new Parser(tokens, this.inDebugMode);
                
                this.info("Parsing program " + this.currentProgram);
                
                var parseOut = this._Parser.parse();

                
                if (parseOut.errors > 0) {
                    this.info("Parsing failed with " + parseOut.errors + " errors and " + parseOut.warnings + " warnings\n");
                    this.caughtError = true;
                } else {
                    this.info("Parsing complete with " + parseOut.errors + " errors and " + parseOut.warnings + " warnings\n");
                }

                //CST printing
                if (!this.caughtError) {
                    var CST = parseOut.concreteSyntaxTree;
                    this.info("Concrete Syntax Tree:");
                    CST.printTree(CST.getRoot());
                    this.info("End CST\n");
                }

            } else {
                this.err("Parsing skipped due to lexer error.");
            }

            /* Semantic Analysis */
            if (!this.caughtError) {
                this._Analyzer = new SemanticAnalyzer(CST, this.inDebugMode);

                this.info("Syntactic Analysis for program " + this.currentProgram);
                this._Analyzer.analyze();
            } else {
                this.err("Semantic analysis skipped due to parser error.")
            }


            /* Code Generation */

            //Reset for next program
            this.reset();
            infiniteProtection++;
        }
    }

    private reset() {
        this._Lexer.reset();
        this.caughtError = false;
    }
}
