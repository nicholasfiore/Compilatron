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
	private lastPos: number;

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

	private reachedEOP: boolean;

	private tokens: Array<Token>;

	private _Compiler: Compiler;

	//RegEx objects for string comparisons
	private fullGrammarCharRegEx = new RegExp('[a-z0-9{}()+="!$]|\s'); //for checking if a character to be added actually exists in any part of the grammer
	//private notInGrammerRegEx = new RegExp();
	private whitespaceRegEx = new RegExp('\s');

	private keywordRegEx = new RegExp('print|while|if|int|string|boolean|false|true');
	private idOrCharRegEx = new RegExp('[a-z]');
	private symbolsRegEx = new RegExp('^==$|^!=$|^[{}()+="$]$');
	private partialSymRegEx = new RegExp('^[{}()+"$!=]$');
	private equalityRegEx = new RegExp('!=|==|[=!]')
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
		this.lastPos = 1;

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
		while(!this.reachedEOP && this.currStreamPos < sourceCode.length && !(infiniteProtection >= 1000)) {
			
			this.currChar = sourceCode.charAt(this.currStreamPos);

			/* initial check for entering a comment */
			if (this.currChar === "/") {
				if (sourceCode.charAt(this.currStreamPos + 1) === "*") {
					this.inComment = true;
				}
			}

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
			// if ((this.partialSymRegEx.test(this.currChar) || !this.fullGrammarCharRegEx.test(this.currChar) 
			// || this.whitespaceRegEx.test(this.currChar))
			// && (this.currentStr !== "")) 
			if (!this.inComment) { //everything inside a comment is ignored
				if (this.currentStr !== "") {
					if (this.whitespaceRegEx.test(this.currChar)) {
						console.log("here1");
						this.tokenize();
					// } else if (this.currentStr.length === 1 && this.partialSymRegEx.test(this.currentStr)) {
					// 	if (this.currentStr === "!" && this.currChar !== "=") {
					// 		this.tokenize();
					// 	} else if (this.currentStr === "=" && this.currChar !== "=") {
					// 		this.tokenize();
					// 	} else {
					// 		this.checkTokenValidity();
					// 		//this.tokenize();
					// 	}
					} else if(this.partialSymRegEx.test(this.currChar)) {
						if (this.currChar === '!' || this.currChar === "=") {
							if (sourceCode.charAt(this.currStreamPos + 1) === "=") {
								if (this.symbolCharsLexed < 2) {
									this.checkTokenValidity();
								}
							}
						}
					} else if (this.partialSymRegEx.test(this.currChar)) {
						this.tokenize();
					} else if (!this.fullGrammarCharRegEx.test(this.currChar)) {
						this.tokenize();
					} 
				} else {
					this.checkTokenValidity();
				}
			} else {
				//logic if inside a comment
				if (this.currChar === "*") {
					if (sourceCode.charAt(this.currStreamPos + 1) === "/") {
						this.inComment = false;

						//increment everything since we're "cheating" by looking a character ahead
						this.currStreamPos++;
						this.currPos++;
					}
				}
				//increment display values for debugging
				//since we never enter checkTokenValidity()
				//to increment them. Comments can also contain
				//newlines, so keeping track is important
				this.currStreamPos++;
				if (this.currChar === '\n') {
					this.currLine++;
					this.currPos = 1;
					this.lastPos
				} else {
					this.currPos++;
				}
			}

			infiniteProtection++;
		}
		//One final tokenization must occur when the EOP/EOF is reached
		this.tokenize();

		return {tokens: this.tokens, errors: this.errors, warnings: this.warnings};
	}

	private checkTokenValidity() {
		this.currentStr += this.currChar;
		console.log(this.currentStr);
		if (this.keywordRegEx.test(this.currentStr)) {
			switch (this.currentStr) {
				case 'print': {
					this.lastValidKind = "PRINT"
					break;
				}
				case 'while': {
					this.lastValidKind = "WHILE"
					break;
				}
				case 'if': {
					this.lastValidKind = "IF"
					break;
				}
				case 'int': {
					this.lastValidKind = "I_TYPE"
					break;
				}
				case 'string': {
					this.lastValidKind = "S_TYPE"
					break;
				}
				case 'boolean': {
					this.lastValidKind = "B_TYPE"
					break;
				}
				case 'false': {
					this.lastValidKind = "FALSE"
					break;
				}
				case 'true': {
					this.lastValidKind = "TRUE"
					break;
				}
			}
			this.lastValidToken = this.currentStr;
			this.lastValidStart = this.lastStreamPos;
			this.lastValidEnd = this.currStreamPos;
		} else if (this.symbolsRegEx.test(this.currentStr)) {
		// } else if (this.currentStr === "!=" || this.currentStr === "==" || this.currentStr === "=" || this.currentStr === "{" || this.currentStr === "}" || this.currentStr === "(" || this.currentStr === ")" || this.currentStr === "+" || this.currentStr === "\"" || this.currentStr === "$") {
			console.log("here2");
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
				case '=': {
					this.lastValidKind = "SYM_ASSIGN";
					break;
				}
				case '$': { //special symbol
					this.lastValidKind = "EOP";
					break;
				}
				
			}
			this.lastValidToken = this.currentStr;
			this.lastValidStart = this.lastStreamPos;
			this.lastValidEnd = this.currStreamPos;

			this.symbolCharsLexed++;
		} else if (this.whitespaceRegEx.test(this.currentStr)) {
			if (this.isQuotes && this.currentStr == " ") {
				this.lastValidKind = "CHAR";
				this.lastValidToken = this.currentStr;
				this.lastValidStart = this.lastStreamPos;
				this.lastValidEnd = this.currStreamPos;
			}
			//if not in quotes, ignore
		}
		else {
			//do nothing
			//if a string isn't a valid token, 
			//it's possible that it hasn't 
			//gotten all its characters yet
			//(like a keyword)
		}

		console.log(this.lastValidToken);

		//increment display values for debugging
		this.currStreamPos++;
		if (this.currChar === '\n') {
			this.currLine++;
			this.currPos = 1;
			this.lastPos
		} else {
			this.currPos++;
		}
	}

	private tokenize() {
		var token: Token;
		if (this.whitespaceRegEx.test(this.currentStr)) {
			console.log("reached");
			//if the string is just a whitespace character, toss it
		} else if (this.lastValidToken === "") {
			//if there was no valid token found, consume the full scanned input and
			//throw an error
			token = {
				kind: "ERROR",
				value: this.currentStr,
				line: this.currLine,
				position: (this.currPos - (this.currentStr.length + 1))
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
			this.info(token.kind + " [ " + token.value + " ] found at (" + token.line + ":" + token.position + ")");
		}
		this.lastStreamPos = this.currStreamPos;
		this.currentStr = "";

		this.lastValidToken = "";

		this.symbolCharsLexed = 0;

		if (token !== undefined && token.kind === "EOP") {
			this.reachedEOP = true;
		}
	}

	public reset() {

	}
}