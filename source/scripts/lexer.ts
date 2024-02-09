/* lexer.ts  */

//lexer returns the token stream
class Lexer extends Component {
	private lastValidToken: string;
	private lastValidStart: number;
	private lastValidEnd: number;

	private warnings: number;
	private errors: number;

	private currentStr: string;

	private charStreamPos: number; //position in the unformatted character stream (the string itself)
	private isQuotes: boolean; //technically part of the parser, but makes lexing easier

	private tokens: Array<Token>;

	private _Compiler: Compiler;

	//RegEx objects for string comparisons
	private fullGrammarCharRegEx = new RegExp('[a-z0-9{}()+="!]'); //for checking if a character to be added actually exists in any part of the grammer
	private symbolsRegEx = new RegExp('[{|}|(|)|+|=|"]|==|!=');

	constructor(comp: Compiler) {
		super("lexer");

		this._Compiler = comp;

		this.lastValidToken = "";
		this.lastValidStart = 0;
		this.lastValidEnd = 0;

		this.errors = 0;
		this.warnings = 0;

		this.currentStr = "";

		this.charStreamPos = 0;
		this.isQuotes = false;
		this.tokens = new Array<Token>;
	}

	
	public lex() {
		// Grab the "raw" source code.
		var sourceCode = this._Compiler.sourceCode;
		// Trim the leading and trailing spaces.
		sourceCode = Utils.trim(sourceCode);
		
		//main lexing loop
		while(this.charStreamPos != null && sourceCode.charAt(this.charStreamPos)) {
			//only continues lexing if the character actively being buffered actual exists in
			//any part of the grammer, otherwise the lexer throws an error
			if (this.fullGrammarCharRegEx.test(sourceCode.charAt(this.charStreamPos))) {
				this.currentStr.concat(sourceCode.charAt(this.charStreamPos));
			} else {
				this.err("(" + this._Compiler.currLine + ":" + this._Compiler.currPos + ") Unrecognized token: " + sourceCode.charAt(this.charStreamPos));
				var token: Token = {
					kind: "error",
					line: this._Compiler.currLine,
					position: this._Compiler.currPos
				}
				this.tokens.push(token);
			}
			

		}

		return this.tokens;
	}
}

