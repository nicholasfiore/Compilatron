//compiler super class

class Compiler extends Component {
    /* Globals
    These variables can be used by any part of the compiler */
    public currentProgram: number;

    public sourceCode: string;

    private reachedEOF: boolean = false;

    private _Lexer : Lexer;


    constructor(source: string) {
        super("Compiler");
        this.currentProgram = 0;
        
        this.sourceCode = source;
        //passing the compiler into its own components allows the components to access "global" variables
        this._Lexer = new Lexer(this);
    }

    public compile() {
        this.currentProgram++;
        var lexOut: Array<Token> = this._Lexer.lex();
        console.log(lexOut);
    }
}
