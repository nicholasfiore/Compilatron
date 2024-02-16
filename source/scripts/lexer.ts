/* lexer.ts  */

//lexer returns the token stream
class Lexer extends Component {
	private sourceCode: string;

	private lastValidToken: string;
	private lastValidKind: string;
	private lastValidStart: number;
	private lastValidEnd: number;

	private inQuotes: boolean;
	private inComment: boolean;

	private currLine: number;
    private currPos: number;
	private lastPos: number;
	private lastLineLength: number;

	private warnings: number;
	private errors: number;

	private currChar: string;
	private currentStr: string;

	private charsLexed: number; //keeps track of how many characters have been parsed since a symbol or part of a symbol was found (symbols can only have 2 chars)

	private currStreamPos: number; //position in the unformatted character stream (the string itself)
	private lastStreamPos: number;

	private isQuotes: boolean; //technically part of the parser, but makes lexing easier
	private isComment: boolean;
	private isCharOrDigit: boolean;

	private reachedEOP: boolean;
	private reachedEOF: boolean;

	private tokens: Array<Token>;

	//RegEx objects for string comparisons
	private fullGrammarCharRegEx = new RegExp('[a-z0-9{}()+="!$]|\s'); //for checking if a character to be added actually exists in any part of the grammer
	//private notInGrammerRegEx = new RegExp();
	private whitespaceRegEx = new RegExp(/\s/);

	private keywordRegEx = new RegExp('^print$|^while$|^if$|^int$|^string$|^boolean$|^false$|^true$');
	
	private idOrCharRegEx = new RegExp('^[a-z]$');
	
	private symbolsRegEx = new RegExp('^==$|^!=$|^[{}()+="$]$');
	private partialSymRegEx = new RegExp('^[{}()+"$!=]$');
	private notAnEqualitySymRegEx = new RegExp('^[^!=]$')

	private digitRegEx = new RegExp('^[0-9]$');
	//char goes here, but it's already accounted for

	public constructor(source: string) {
		super("Lexer");

		this.sourceCode = Utils.trim(source);

		this.lastValidToken = "";
		this.lastValidKind = "";
		this.lastValidStart = 0;
		this.lastValidEnd = 0;

		this.charsLexed = 0;

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
		
		this.inQuotes = false;
		this.inComment = false;
		this.isCharOrDigit = false;

		this.tokens = new Array<Token>;
	}

	
	public lex() {
		// Grab the "raw" source code.
		console.log(this.sourceCode);
		
		//main lexing loop
		var infiniteProtection: number = 0;
		while(!this.reachedEOP && !this.reachedEOF && !(infiniteProtection >= 10000)) {
			this.currChar = this.sourceCode.charAt(this.currStreamPos);

			/* initial check for entering a comment */
			if (this.currChar === "/") {
				if (this.sourceCode.charAt(this.currStreamPos + 1) === "*") {
					this.inComment = true;
				}
			}

			if (!this.inComment) { //everything inside a comment is ignored
				//an empty string means that no characters have been lexed
				//so at least one character should be checked before 
				//trying to tokenize
				if (this.currentStr !== "") { 
					if (this.inQuotes) {
						//every character is tokenized one at a time in quotes
						this.tokenize();
					}
					else if (this.whitespaceRegEx.test(this.currChar)) {
						//if the current character is whitespace, it is safe to tokenize the current str
						this.tokenize();
					} 
					else if (this.whitespaceRegEx.test(this.currentStr)) {
						//ensure that whitespace at the start of a string is thrown away,
						//or that spaces inside a string are properly tokenized
						if (this.inQuotes) {
							this.checkTokenValidity();
						} else {
							this.tokenize();
						}
					} 
					else if (this.partialSymRegEx.test(this.currentStr) && this.currentStr !== "$") {
						//symbols should always be checked for 2 characters, just in case
						//the exception is the EOP, which should never be followed by another symbol
						//that is meant to be in the same program
						this.checkTokenValidity();
					} 
					else if (this.digitRegEx.test(this.currentStr)) {
						//digits are ONLY ever one character
						this.tokenize();
					} 
					else if (this.partialSymRegEx.test(this.currChar)) {
						//if the currently lexed string isn't a symbol, 
						//we can just tokenize when hitting a symbol
						this.tokenize();
					} 
					else if (!this.fullGrammarCharRegEx.test(this.currChar)) {
						//any non-grammer character counts as an (unrecognized) symbol, so tokenize
						this.tokenize();
					} 
					else {
						this.checkTokenValidity();
					}
				} 
				else if (this.currStreamPos >= this.sourceCode.length) {
					//EOF reached, tokenize
					this.tokenize();
				} 
				else {
					this.checkTokenValidity();
				}
			} 
			else {
				//logic if inside a comment
				if (this.currChar === "*") {
					if (this.sourceCode.charAt(this.currStreamPos + 1) === "/") {
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
					this.lastPos = 1;
				} 
				else {
					this.currPos++;
				}
			}
			

			infiniteProtection++;
		}
		if (infiniteProtection >= 1000) {
			console.log("WARNING: Infinite loop detected");
		}

		if (this.reachedEOF && !this.reachedEOP) {
			this.warn("EOF reached before EOP ($)");
			this.warnings++;
		}

		return {tokens: this.tokens, errors: this.errors, warnings: this.warnings, EOF: this.reachedEOF};
	}

	//checks the current string to see if a valid token can be matched with it
	private checkTokenValidity() {
		this.currentStr += this.currChar;
		if (!this.inQuotes) {
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
			} else if (this.idOrCharRegEx.test(this.currentStr)) {
				this.lastValidKind = "ID";
				this.lastValidToken = this.currentStr;
				this.lastValidStart = this.lastStreamPos;
				this.lastValidEnd = this.currStreamPos;
			} else if (this.symbolsRegEx.test(this.currentStr)) {
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

			} 
			else if (this.digitRegEx.test(this.currentStr)) {
					this.lastValidKind = "DIGIT";
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
		else {
			if (this.idOrCharRegEx.test(this.currentStr) || this.currentStr == " ") {
				this.lastValidKind = "CHAR";
				this.lastValidToken = this.currentStr;
				this.lastValidStart = this.lastStreamPos;
				this.lastValidEnd = this.currStreamPos;
			}
			else if (this.currentStr === "$") {
				//EOP has precedence over characters/charlists
				this.lastValidKind = "EOP";
				this.lastValidToken = this.currentStr;
				this.lastValidStart = this.lastStreamPos;
				this.lastValidEnd = this.currStreamPos;
			}
			else if (this.currentStr === "\"") {
				//necessary to exit quotes
				this.lastValidKind = "SYM_QUOTE";
				this.lastValidToken = this.currentStr;
				this.lastValidStart = this.lastStreamPos;
				this.lastValidEnd = this.currStreamPos;
			}
			else {
				//any other character passed is considered an invalid token

			}
		}


		this.charsLexed = this.currentStr.length;

		//increment display values for debugging
		this.currStreamPos++;
		if (this.currChar === '\n') {
			this.currLine++;

			this.currPos = 1;
			this.lastLineLength = this.lastPos;
			this.lastPos = 1;

		} 
		else {
			this.currPos++;
		}
	}

	//Tokenizes the last matched valid token
	//if none were found, returns the entire string that has been lexed as an error
	//otherwise, the token is pushed to the token stream
	private tokenize() {
		var token: Token;
		if (this.whitespaceRegEx.test(this.currentStr) && !this.inQuotes) {
			
			//if the string is just a whitespace character NOT IN A STRING, toss it
			this.lastValidEnd = this.currStreamPos - 1;
			
		} 
		else if (this.currStreamPos >= this.sourceCode.length && this.currentStr === "") {
			//an empty string at the end of file means that everything up to the EOF has been tokenized
			this.reachedEOF = true;
		} 
		else if (this.lastValidToken === "") {
			//if there was no valid token found, consume the full scanned input and
			//throw an error
			if (!this.inQuotes) {
				this.err("invalid token at ("  + this.currLine + ":" + (this.currPos - (this.currentStr.length)) + "): " + this.currentStr);
				this.errors++;
				this.lastValidEnd = this.currStreamPos - 1;
			} else {
				//if the lexer is currently in quotes, every lack of valid token is an invalid character
				//newline should have a special check case so that formatting is not screwed up
				if (this.currentStr === "\n") {
					this.err("invalid character found ("  + (this.currLine -1) + ":" + (this.lastLineLength) + "): " + "\\n");
				} else {
					this.err("invalid character found ("  + this.currLine + ":" + (this.lastPos) + "): " + this.currentStr);
				}
				this.errors++;
				this.lastValidEnd = this.currStreamPos - 1;
			}
		} 
		else {
			//else, a valid token was found
			token = {
				kind: this.lastValidKind,
				value: this.lastValidToken,
				line: this.currLine,
				position: this.lastPos
			}
			this.tokens.push(token);
			this.info(token.kind + " [ " + token.value + " ] found at (" + token.line + ":" + token.position + ")");
		}

		this.currStreamPos = this.lastValidEnd + 1;
		this.lastStreamPos = this.currStreamPos;

		this.currPos = this.currPos - this.currentStr.length + 1;
		this.lastPos = this.currPos;
		
		this.currentStr = "";

		this.lastValidToken = "";

		this.charsLexed = this.currentStr.length;

		if (token !== undefined) {
			if (token.kind === "EOP") {
				this.reachedEOP = true;
				if (!this.sourceCode.charAt(this.currStreamPos + 1)) {
					this.reachedEOF = true;
				}
				if (this.inQuotes) {
					this.warn("EOP reached before a char list was closed with [ \" ]")
					this.warnings++;
				}
			}
			if (token.kind === "SYM_QUOTE") {
				this.inQuotes = !this.inQuotes;
			}
		}
		
	}

	//resets the necessary members to their initial values
	public reset() {
		this.errors = 0;
		this.warnings = 0;
		this.tokens = new Array<Token>;
		this.reachedEOP = false;
		this.inQuotes = false; //in case a program was ended while quotes were still open
	}
}