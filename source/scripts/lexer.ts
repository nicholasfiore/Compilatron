/* lexer.ts  */

module TSC {
	export class Lexer {
		public static lex() {
		    {
		        // Grab the "raw" source code.
		        let sourceCode: string = (<HTMLInputElement>document.getElementById("taSourceCode")).value;
		        // Trim the leading and trailing spaces.
		        sourceCode = TSC.Utils.trim(sourceCode);
		        // Removes all whitespace characters. Sourced from: https://stackoverflow.com/questions/6623231/remove-all-white-spaces-from-text
				sourceCode = sourceCode.replace(/\s/g, '');
		        return sourceCode;
		    }
		}
	}
}
