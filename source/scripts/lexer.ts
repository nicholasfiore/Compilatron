/* lexer.ts  */
import { Compiler } from "./compiler";
	//lexer returns the token stream
export class Lexer extends Compiler {
	constructor() {
		super();
	}

	
	public static lex() {
		{
			
			//tokens;
			// Grab the "raw" source code.
			let sourceCode: string = (<HTMLInputElement>document.getElementById("taSourceCode")).value;
			// Trim the leading and trailing spaces.
			sourceCode = TSC.Utils.trim(sourceCode);
			
			

			//return tokens;
		}
	}
}

