/* lexer.ts  */
import { Compiler } from "./compiler";
//lexer returns the token stream
export class Lexer extends Compiler {
    constructor() {
        super();
        this.tokens = new Array;
    }
    lex() {
        // Grab the "raw" source code.
        let sourceCode = document.getElementById("taSourceCode").value;
        // Trim the leading and trailing spaces.
        sourceCode = TSC.Utils.trim(sourceCode);
        while (this.charStreamPos != null && sourceCode.charAt(this.charStreamPos)) {
        }
        return this.tokens;
    }
}
//# sourceMappingURL=lexer.js.map