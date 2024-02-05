//compiler super class
import { Lexer } from "./lexer";
import { Token } from "./token";

class Compiler {
    /* Globals
    These variables can be used by any part of the compiler */
    tokens: Array<Token>;
    currLine: number;
    currPos: number;

}