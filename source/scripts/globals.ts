
/*
var onDocumentLoad = function() {
	TSOS.Control.hostInit();
};
*/
import { Lexer } from "./lexer";
import { Token } from "./token";

var _Lexer = Lexer;

// Global variables
    var tokens = Array<Token>;
    var tokenIndex = 0;
    var currentToken = "";
    var errorCount = 0;
    var EOF = "$";
