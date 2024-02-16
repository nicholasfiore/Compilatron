/* Parser.ts */

class Parser extends Component {
    private tokens: Array<Token>;

    private currToken: Token;
    private currPos: number;

    private errors: number;
    private warnings: number;

    public constructor(tokenStream: Array<Token>) {
        super('Parser');

        this.tokens = tokenStream;

        this.currPos = 0;

        this.errors = 0;
        this.warnings = 0;
    }

    public parse() {
        this.currToken = this.tokens[this.currPos];
        this.parseStart();
        console.log(this.errors)
    }

    private match(desiredTokenKind: string, tokenToMatch: Token) {
        if (tokenToMatch) { //only checks if the tokenToMatch exists
            if (desiredTokenKind === tokenToMatch.kind) {
                this.info("Found " + tokenToMatch.kind + " terminal");
            }
            else {
                //There is an error
                this.err("Expected {" + desiredTokenKind + "}, found " + tokenToMatch.kind + " [" + tokenToMatch.value + "]");
                this.errors++;
            }
            this.currPos++;
            this.currToken = this.tokens[this.currPos];
        }
    }

    private parseStart() {
        this.parseBlock();
        this.match("EOP", this.currToken);
    }

    private parseBlock() {
        this.match("SYM_L_BRACE", this.currToken);
        this.parseStatementList();
        this.match("SYM_R_BRACE", this.currToken);
    }

    private parseStatementList() {
        if (["SYM_L_BRACE", "PRINT", "ID", "I_TYPE", "S_TYPE", "B_TYPE", "WHILE", "IF"].indexOf(this.currToken.kind) !== -1) {
            this.parseStatement();
            this.parseStatementList();
        }
        //ε production
        else {
            //Do nothing
        }
    }

    private parseStatement() {
        //Block
        if (this.currToken.kind === "SYM_L_BRACE") {
            this.parseBlock();
        }
        //VarDecl
        else if (["I_TYPE", "S_TYPE", "B_TYPE"].indexOf(this.currToken.kind) !== -1) {
            this.parseVariableDeclaration();
        }
        //Assignment
        else if (this.currToken.kind === "ID") {
            this.parseAssignmentStatement();
        }
        //Print statement
        else if (this.currToken.kind === "PRINT") {
            this.parsePrintStatement();
        }
        //While statement
        else if (this.currToken.kind === "WHILE") {
            this.parseWhileStatement();
        }
        //If statement
        else if (this.currToken.kind === "IF") {
            this.parseIfStatement();
        }
    }

    private parsePrintStatement() {
        this.match("PRINT", this.currToken);
        this.match("SYM_L_PAREN", this.currToken);
        this.parseExpression();
        this.match("SYM_R_PAREN", this.currToken);
    }

    private parseAssignmentStatement() {
        this.match("ID", this.currToken);
        this.match("SYM_ASSIGN", this.currToken);
        this.parseExpression();
    }

    private parseVariableDeclaration() {
        this.parseType();
        this.match("ID", this.currToken);
    }

    private parseWhileStatement() {
        this.match("WHILE", this.currToken);
        this.parseBooleanExpression();
        this.parseBlock();
    }

    private parseIfStatement() {
        this.match("IF", this.currToken);
        this.parseBooleanExpression();
        this.parseBlock();
    }

    private parseExpression() {

    }

    private parseIntExpression() {

    }

    private parseStringExpression() {

    }

    private parseBooleanExpression() {

    }

    private parseID() {

    }

    private parseCharList() {

    }

    private parseType() {

    }

    private parseChar() {

    }

    private parseSpace() {

    }

    private parseDigit() {

    }

    private parseBooleanOperation() {

    }

    private parseBooleanValue() {

    }

    private parseIntegerOperation() {

    }
}