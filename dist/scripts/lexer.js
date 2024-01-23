/* lexer.ts  */
var TSC;
(function (TSC) {
    class Lexer {
        static lex() {
            {
                // Grab the "raw" source code.
                var sourceCode = document.getElementById("taSourceCode").value;
                // Trim the leading and trailing spaces.
                sourceCode = TSC.Utils.trim(sourceCode);
                // TODO: remove all spaces in the middle; remove line breaks too.
                return sourceCode;
            }
        }
    }
    TSC.Lexer = Lexer;
})(TSC || (TSC = {}));
//# sourceMappingURL=lexer.js.map