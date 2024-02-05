/* lexer.ts  */



module TSC {
	export class Lexer {
		public static lex() {
		    {
				let tokens: Array<Token> = new Array<Token>;
		        // Grab the "raw" source code.
		        let sourceCode: string = (<HTMLInputElement>document.getElementById("taSourceCode")).value;
		        // Trim the leading and trailing spaces.
		        sourceCode = TSC.Utils.trim(sourceCode);
		        
		        return sourceCode;
		    }
		}
	}
}
