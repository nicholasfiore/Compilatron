/* Parser.ts */

class Parser extends Component {
    private tokens: Array<Token>;

    private currToken: Token;
    private currPos: number;

    constructor(tokenStream: Array<Token>) {
        super('Parser');

        this.tokens = tokenStream;
    }

    private match(desiredTokenKind: string, tokenToMatch: Token) {

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
    }

    private parseStatement() {
        //Block
        if (this.currToken.kind === "SYM_L_BRACE") {
            this.parseBlock();
        }
        //VarDecl
        else if (["I_TYPE", "S_TYPE", "B_TYPE"].indexOf(this.currToken.kind) !== -1) {
            this.parseType();
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
        //ε production
        else {
            //Do nothing
        }
    }

    private parsePrintStatement() {

    }

    private parseAssignmentStatement() {

    }

    private parseVarDeclaration() {

    }

    private parseWhileStatement() {

    }

    private parseIfStatement() {

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