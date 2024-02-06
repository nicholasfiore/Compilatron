//compiler super class
namespace TSC {
    export class Compiler extends Component {
        /* Globals
        These variables can be used by any part of the compiler */
        // public currentProgram: number;
        // public tokens: Array<Token>;
        // public currLine: number;
        // public currPos: number;

        private _Lexer : Lexer;


        constructor() {
            super("compiler");
            this._Lexer = new Lexer();
        }
    }
}