/* lexer.ts  */
var TSC;
(function (TSC) {
    class Lexer {
        static lex() {
            {
                // Grab the "raw" source code.
                let sourceCode = document.getElementById("taSourceCode").value;
                // Trim the leading and trailing spaces.
                sourceCode = TSC.Utils.trim(sourceCode);
                console.log(sourceCode);
                // Removes all whitespace characters. Sourced from: https://stackoverflow.com/questions/6623231/remove-all-white-spaces-from-text
                sourceCode = sourceCode.replace(/\s/g, '');
                console.log(sourceCode);
                return sourceCode;
            }
        }
    }
    TSC.Lexer = Lexer;
})(TSC || (TSC = {}));
//# sourceMappingURL=lexer.js.map