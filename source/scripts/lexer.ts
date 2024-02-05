/* lexer.ts  */

module TSC {
	export class Lexer {
		public static lex() {
		    {
		        // Grab the "raw" source code.
		        let sourceCode: string = (<HTMLInputElement>document.getElementById("taSourceCode")).value;
		        // Trim the leading and trailing spaces.
		        sourceCode = TSC.Utils.trim(sourceCode);
		        
		        return sourceCode;
		    }
		}
	}

	export interface Token {
		kind: string;
		value?: string;
		line: number;
		position: number;
	}
}
