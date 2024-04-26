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
    private _Generator : Generator;

    constructor(source: string, enableDebug: boolean) {
        super("Compiler", enableDebug);
        this.inDebugMode = enableDebug;

        this.currentProgram = 0;
        
        this.sourceCode = source;
        //passing the compiler into its own components allows the components to access "global" variables
        this._Lexer = new Lexer(this.sourceCode, this.inDebugMode, this.currentProgram);
    }

    public compile() {
        while (!this.reachedEOF) {
            this.currentProgram++;

            Tabs.generateTabContent(this.currentProgram);

            /* Lexer */
            this.info("Lexing program " + this.currentProgram);
            //this.break();
            var lexOut = this._Lexer.lex();
            var tokens = lexOut.tokens;
            
            if (lexOut.errors > 0) {
                this.info("Lexer failed with " + lexOut.errors + " errors and " + lexOut.warnings + " warnings\n");
                //this.break();
                this.caughtError = true;
            } else {
                this.info("Lexer returned " + tokens.length + " tokens with " + lexOut.errors + " errors and " + lexOut.warnings + " warnings\n");
                //this.break();
            }
            if (lexOut.EOF) {
                this.reachedEOF = true;
            }

            /* Parser */
            if (!this.caughtError) {
                //console.log("here");
                this._Parser = new Parser(tokens, this.inDebugMode, this.currentProgram);
                
                this.info("Parsing program " + this.currentProgram);
                
                var parseOut = this._Parser.parse();

                
                if (parseOut.errors > 0) {
                    this.info("Parsing failed with " + parseOut.errors + " errors and " + parseOut.warnings + " warnings\n");
                    //this.break();
                    this.caughtError = true;
                } else {
                    this.info("Parsing complete with " + parseOut.errors + " errors and " + parseOut.warnings + " warnings\n");
                    //this.break();
                }

                //CST printing
                if (!this.caughtError) {
                    var CST = parseOut.concreteSyntaxTree;
                    this.info("Concrete Syntax Tree:");
                    CST.printTree(CST.getRoot());
                    this.info("End CST\n");
                    //this.break();
                }

            } else {
                this.err("Parsing skipped due to lexer error.");
            }

            /* Semantic Analysis */
            if (!this.caughtError) {
                this._Analyzer = new SemanticAnalyzer(CST, this.inDebugMode, this.currentProgram);

                this.info("Syntactic Analysis for program " + this.currentProgram);
                var analyzeOut = this._Analyzer.analyze();
                
                if (analyzeOut.errors > 0) {
                    this.break();
                    this.info("Syntactic Analysis failed with " + analyzeOut.errors + " errors and " + analyzeOut.warnings + " warnings\n")
                    //this.break();
                    this.caughtError = true;
                } else {
                    this.break();
                    this.info("Syntactic Analysis finished with " + analyzeOut.warnings + " warnings\n")
                    //this.break();
                }
            } else {
                this.err("Semantic analysis skipped due to parser error.")
            }


            /* Code Generation */
            if (!this.caughtError) {
                //this._Generator = new Generator(analyzeOut.AST, analyzeOut.symbolTable, this.debugMode)
                this._Generator = new Generator(analyzeOut.AST, analyzeOut.symbolTree, this.debugMode, this.currentProgram)

                this.info("Generating code...");
                this._Generator.generate();
            } else {
                this.err("Code generation skipped due to semantic error.")
            }

            //Reset for next program
            this.reset();
        }
    }

    private reset() {
        this._Lexer.reset();
        this.caughtError = false;
    }

    
}
