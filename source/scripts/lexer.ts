/* lexer.ts  */
import { Token } from "./token";
	//lexer returns the token stream
	export class Lexer {
		public static lex() {
		    {
				let tokens: Array<Token> = new Array<Token>; //token stream
		        // Grab the "raw" source code.
		        let sourceCode: string = (<HTMLInputElement>document.getElementById("taSourceCode")).value;
		        // Trim the leading and trailing spaces.
		        sourceCode = TSC.Utils.trim(sourceCode);
		        
				

		        return tokens;
		    }
		}
	}

