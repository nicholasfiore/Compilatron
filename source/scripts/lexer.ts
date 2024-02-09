/* lexer.ts  */

//lexer returns the token stream
class Lexer extends Component {
	private lastValidToken: string;
	private lastValidKind: string;
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

	private reachedEOP;

	private tokens: Array<Token>;

	private _Compiler: Compiler;

	//RegEx objects for string comparisons
	private fullGrammarCharRegEx = new RegExp('[a-z0-9{}()+="!$]|\s'); //for checking if a character to be added actually exists in any part of the grammer
	//private notInGrammerRegEx = new RegExp();
	private whitespaceRegEx = new RegExp(/\s/);

	private keywordRegEx = new RegExp('print|while|if|int|string|boolean|false|true');
	private idOrCharRegEx = new RegExp('[a-z]');
	private symbolsRegEx = new RegExp('[{|}|(|)|+|=|"|!]|==|!=');
	private digitRegEx = new RegExp('[0-9]');
	//char goes here, but it's already accounted for

	constructor(comp: Compiler) {
		super("Lexer");

		this._Compiler = comp;

		this.lastValidToken = "";
		this.lastValidKind = "";
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
			if (this.fullGrammarCharRegEx.test(this.currChar)) {
				//only concatenate if the character isn't whitespace, or is in a string
				if (!this.whitespaceRegEx.test(this.currChar) || this.isQuotes) {
					this.currentStr.concat(this.currChar);
				}
				
				//this.info("char [ " + this.currChar + " ] found at (" + this.currLine + ":" + this.currPos + ")");

				this.checkTokenValidity();


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

	private checkTokenValidity() {
		if (this.symbolsRegEx.test(this.currentStr)) {
			switch (this.currentStr) {
				case '{': {
					this.lastValidToken = this.currentStr;
					this.lastValidEnd = this.currPos;
					break;
				}
				case '}': {
					this.lastValidToken = this.currentStr;
					this.lastValidEnd = this.currPos;
					break;
				}
				case '(': {
					this.lastValidToken = this.currentStr;
					this.lastValidEnd = this.currPos;
					break;
				}
				case ')': {
					this.lastValidToken = this.currentStr;
					this.lastValidEnd = this.currPos;
					break;
				}
				case '+': {
					this.lastValidToken = this.currentStr;
					this.lastValidEnd = this.currPos;
					break;
				}
				case '=': {
					this.lastValidToken = this.currentStr;
					this.lastValidEnd = this.currPos;
					break;
				}
				case '"': {
					this.lastValidToken = this.currentStr;
					this.lastValidEnd = this.currPos;
					break;
				}
				case '==': {
					this.lastValidToken = this.currentStr;
					this.lastValidEnd = this.currPos;
					break;
				}
				case '!=': {
					this.lastValidToken = this.currentStr;
					this.lastValidEnd = this.currPos;
					break;
				}
			}
		}
		else {
			//do nothing
			//if a string isn't a valid token, 
			//it's possible that it hasn't 
			//gotten all its characters 
			//(like a keyword)
		}
	}

	private tokenize() {

	}
}