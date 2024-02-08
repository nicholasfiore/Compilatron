//compiler super class

class Compiler extends Component {
    /* Globals
    These variables can be used by any part of the compiler */
    public currentProgram: number;
    
    public currLine: number;
    public currPos: number;

    public sourceCode: string;

    private _Lexer : Lexer;


    constructor(source: string) {
        super("compiler");
        this.sourceCode = source;
        //passing the compiler into its own components allows the components to access "global" variables
        this._Lexer = new Lexer(this);
    }

    public compile() {
        var lexOut: Array<Token> = this._Lexer.lex();
    }
}
