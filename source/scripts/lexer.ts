/* lexer.ts  */
namespace TSC {
	//lexer returns the token stream
	export class Lexer extends Component {
		private lastValidToken: string;
		private lastValidPos: number;
		private charStreamPos: number; //position in the unformatted character stream (the string itself)
		private isQuotes: boolean; //technically part of the parser, but makes lexing easier

		constructor() {
			super("lexer");
			this.lastValidToken = "";
			this.lastValidPos = 0;
			this.charStreamPos = 0;
			this.isQuotes = false;
			//this.tokens = new Array<Token>;
		}

		
		public lex() {
			// Grab the "raw" source code.
			let sourceCode: string = (<HTMLInputElement>document.getElementById("taSourceCode")).value;
			// Trim the leading and trailing spaces.
			sourceCode = TSC.Utils.trim(sourceCode);
			
			while(this.charStreamPos != null && sourceCode.charAt(this.charStreamPos)) {
				
			}

			return "this.tokens";
		}
	}
}
