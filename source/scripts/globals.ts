
/*
var onDocumentLoad = function() {
	TSOS.Control.hostInit();
};
*/
import { Compiler } from "./compiler";
import { Lexer } from "./lexer";
import { Token } from "./token";

var _Lexer = new Lexer();
var _Compiler = new Compiler();

// Global variables
    // var tokens = Array<Token>;
    // var tokenIndex = 0;
    // var currentToken = "";
    // var errorCount = 0;
    // var EOF = "$";
