/* lexer.ts  */

//lexer returns the token stream
class Lexer extends Component {
	private lastValidToken: string;
	private lastValidStart: number;
	private lastValidEnd: number;

	private inQuotes: boolean;
	private inComment: boolean;

	private currLine: number;
    private currPos: number;

	private warnings: number;
	private errors: number;

	private currChar: string;
	private currentStr: string;

	private charStreamPos: number; //position in the unformatted character stream (the string itself)
	private isQuotes: boolean; //technically part of the parser, but makes lexing easier

	private tokens: Array<Token>;

	private _Compiler: Compiler;

	//RegEx objects for string comparisons
	private fullGrammarCharRegEx = new RegExp('[a-z0-9{}()+="!$]'); //for checking if a character to be added actually exists in any part of the grammer
	private whitespaceRegEx = new RegExp(/\s/);
	private symbolsRegEx = new RegExp('[{|}|(|)|+|=|"]|==|!=');

	constructor(comp: Compiler) {
		super("Lexer");

		this._Compiler = comp;

		this.lastValidToken = "";
		this.lastValidStart = 0;
		this.lastValidEnd = 0;



		//unfortunately, debugging coordinates should start at one, unlike arrays
		this.currLine = 1;
		this.currPos = 1;

		this.errors = 0;
		this.warnings = 0;

		this.currChar = "";
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
		while(this.charStreamPos !== null && sourceCode.charAt(this.charStreamPos)) {
			this.currChar = sourceCode.charAt(this.charStreamPos);
			//only checks this char if the character actively being buffered actually exists
			//in any part of the grammer, otherwise the lexer throws an error
			if (this.fullGrammarCharRegEx.test(this.currChar) || this.whitespaceRegEx.test(this.currChar)) {
				this.currentStr.concat(this.currChar);
				this.info("char [ " + this.currChar + " ] found at (" + this.currLine + ":" + this.currPos + ")");

			} else {
				this.err("(" + this.currLine + ":" + this.currPos + ") Unrecognized token: " + sourceCode.charAt(this.charStreamPos));
				var token: Token = {
					kind: "error",
					line: this.currLine,
					position: this.currPos
				}
				this.tokens.push(token);
			}
			this.charStreamPos++;
			if (this.currChar === '\n') {
				this.currLine++;
				this.currPos = 1;
			} else {
				this.currPos++;
			}
		}

		return this.tokens;
	}
}

