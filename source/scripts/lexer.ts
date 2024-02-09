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

	private symbolCharsLexed: number; //keeps track of how many characters have been parsed since a symbol or part of a symbol was found (symbols can only have 2 chars)

	private currStreamPos: number; //position in the unformatted character stream (the string itself)
	private lastStreamPos: number;

	private isQuotes: boolean; //technically part of the parser, but makes lexing easier
	private isComment: boolean;
	private isCharOrDigit: boolean;

	private reachedEOP;

	private tokens: Array<Token>;

	private _Compiler: Compiler;

	//RegEx objects for string comparisons
	private fullGrammarCharRegEx = new RegExp('[a-z0-9{}()+="!$]|\s'); //for checking if a character to be added actually exists in any part of the grammer
	//private notInGrammerRegEx = new RegExp();
	private whitespaceRegEx = new RegExp(/\s/);

	private keywordRegEx = new RegExp('print|while|if|int|string|boolean|false|true');
	private idOrCharRegEx = new RegExp('[a-z]');
	private symbolsRegEx = new RegExp('==|!=|[{|}|(|)|+|=|"|!|$]');
	private digitRegEx = new RegExp('[0-9]');
	//char goes here, but it's already accounted for

	constructor(comp: Compiler) {
		super("Lexer");

		this._Compiler = comp;

		this.lastValidToken = "";
		this.lastValidKind = "";
		this.lastValidStart = 0;
		this.lastValidEnd = 0;

		this.symbolCharsLexed = 0;

		//unfortunately, debugging coordinates should start at one, unlike arrays
		this.currLine = 1;
		this.currPos = 1;
		

		this.errors = 0;
		this.warnings = 0;

		this.currChar = "";
		this.currentStr = "";

		this.currStreamPos = 0;
		this.lastStreamPos = 0;
		
		this.isQuotes = false;
		this.isComment = false;
		this.isCharOrDigit = false;

		this.tokens = new Array<Token>;
	}

	
	public lex() {
		// Grab the "raw" source code.
		var sourceCode = this._Compiler.sourceCode;
		// Trim the leading and trailing spaces.
		sourceCode = Utils.trim(sourceCode);

		//main lexing loop
		var infiniteProtection: number = 0;
		while(!this.reachedEOP && sourceCode.charAt(this.currStreamPos) && !(infiniteProtection >= 1000)) {
			this.currChar = sourceCode.charAt(this.currStreamPos);
			/* 
				This initial if statement is for deciding whether or not to consume 
					the current input and create a token
				The rules, in order, are as follows:
				- Check if the character is a (or part of a) symbol. If it is, consume input.
					- note that invalid ASCII characters are considered "unrecognized symbols"
				- Check if the character is whitespace. If it is, consume input.
				-
				- Check for comment. If currently within a comment, the lexer ignores the char
				- The final check is to ensure there has actually been any input scanned. 
					If currStr is empty, there hasn't been any new input scanned, so move
					on
			*/
			console.log(this.symbolsRegEx.test(this.currChar));
			if ((this.symbolsRegEx.test(this.currChar) || !this.fullGrammarCharRegEx.test(this.currChar) 
			|| this.whitespaceRegEx.test(this.currChar))
			&& (this.currentStr !== "")) {
				this.tokenize();
			} else {
				this.checkTokenValidity();
				
				this.currStreamPos++;
				if (this.currChar === '\n') {
					this.currLine++;
					this.currPos = 1;
				} else {
					this.currPos++;
				}
			}
			infiniteProtection++;
		}

		return this.tokens;
	}

	private checkTokenValidity() {
		this.currentStr += this.currChar;
		console.log(this.currentStr)
		console.log(this.symbolsRegEx.test(this.currentStr));
		
		if (this.symbolsRegEx.test(this.currentStr)) {
			switch (this.currentStr) {
				case '{': {
					this.lastValidKind = "SYM_L_BRACE";
					break;
				}
				case '}': {
					this.lastValidKind = "SYM_R_BRACE";
					break;
				}
				case '(': {
					this.lastValidKind = "SYM_L_PAREN";
					break;
				}
				case ')': {
					this.lastValidKind = "SYM_R_PAREN";
					break;
				}
				case '+': {
					this.lastValidKind = "SYM_ADD";
					break;
				}
				case '=': {
					this.lastValidKind = "SYM_ASSIGN";
					break;
				}
				case '"': {
					this.lastValidKind = "SYM_QUOTE";
					break;
				}
				case '==': {
					this.lastValidKind = "SYM_IS_EQUAL";
					break;
				}
				case '!=': {
					this.lastValidKind = "SYM_IS_NOT_EQUAL";
					break;
				}
				case '$': { //special symbol
					this.lastValidKind = "EOP";
				}
			}
			this.lastValidToken = this.currentStr;
			this.lastValidStart = this.lastStreamPos;
			this.lastValidEnd = this.currStreamPos;
		}
		else {
			//do nothing
			//if a string isn't a valid token, 
			//it's possible that it hasn't 
			//gotten all its characters yet
			//(like a keyword)
		}
	}

	private tokenize() {
		var token: Token;
		if (this.lastValidToken === "") {
			//if there was no valid token found, consume the full scanned input and
			//throw an error
			token = {
				kind: "ERROR",
				value: this.currentStr,
				line: this.currLine,
				position: (this.currPos - this.currentStr.length)
			}
			this.tokens.push(token);
			this.err("invalid token (" + token.line + ":" + token.position + "): " + token.value);
			this.errors++;
		} else {
			//else, a valid token was found
			token = {
				kind: this.lastValidKind,
				value: this.lastValidToken,
				line: this.currLine,
				position: this.lastValidStart
			}
			this.tokens.push(token);
			this.info(token.kind + "[ " + token.value + "] found at (" + token.line + ":" + token.position + ")");
		}
		this.lastStreamPos = this.currStreamPos;
		this.currentStr = "";
	}
}