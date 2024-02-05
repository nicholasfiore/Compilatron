//compiler super class
import { Lexer } from "./lexer";
import { Token } from "./token";

export class Compiler {
    /* Globals
    These variables can be used by any part of the compiler */
    currentProgram: number;
    tokens: Array<Token>;
    currLine: number;
    currPos: number;

    
}