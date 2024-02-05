/* lexer.ts  */
var TSC;
(function (TSC) {
    //lexer returns the token stream
    class Lexer {
        static lex() {
            {
                let tokens = new Array; //token stream
                // Grab the "raw" source code.
                let sourceCode = document.getElementById("taSourceCode").value;
                // Trim the leading and trailing spaces.
                sourceCode = TSC.Utils.trim(sourceCode);
                return tokens;
            }
        }
    }
    TSC.Lexer = Lexer;
})(TSC || (TSC = {}));
//# sourceMappingURL=lexer.js.map