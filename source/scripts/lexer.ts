/* lexer.ts  */

//lexer returns the token stream
class Lexer extends Component {
	private lastValidToken: string;
	private lastValidPos: number;

	private currentStr: string;

	private charStreamPos: number; //position in the unformatted character stream (the string itself)
	private isQuotes: boolean; //technically part of the parser, but makes lexing easier

	private tokens: Array<Token>;

	private _Compiler: Compiler;

	//RegEx objects for string comparisons


	constructor(comp: Compiler) {
		super("lexer");

		this._Compiler = comp;

		this.lastValidToken = "";
		this.lastValidPos = 0;

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
			
		}

		return this.tokens;
	}
}

