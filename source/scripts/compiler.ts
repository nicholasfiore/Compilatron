//compiler super class
namespace TSC {
    export class Compiler {
        /* Globals
        These variables can be used by any part of the compiler */
        public currentProgram: number;
        public tokens: Array<Token>;
        public currLine: number;
        public currPos: number;

        
    }
}