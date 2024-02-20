/* Parser.ts */

class Parser extends Component {
    private tokens: Array<Token>;

    private CST: Tree;

    private currToken: Token;
    private currPos: number;

    private errors: number;
    private warnings: number;

    private alphabet = new RegExp('^[a-z]$');
    private digits = new RegExp('^[0-9]$');

    public constructor(tokenStream: Array<Token>, enableDebug: boolean) {
        super("Parser", enableDebug);

        this.tokens = tokenStream;

        this.CST = new Tree();

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
        this.CST.addNode("start");
        this.parseBlock();
        this.match("EOP", this.currToken);
    }

    private parseBlock() {
        this.CST.addNode("block");
        this.debug("Parsing Block.");
        this.match("SYM_L_BRACE", this.currToken);
        this.parseStatementList();
        this.match("SYM_R_BRACE", this.currToken);
        this.CST.moveUp();
    }

    private parseStatementList() {
        this.debug("Parsing StatementList.");
        this.CST.addNode("statementList");
        if (this.currToken !== undefined && ["SYM_L_BRACE", "PRINT", "ID", "I_TYPE", "S_TYPE", "B_TYPE", "WHILE", "IF"].indexOf(this.currToken.kind) !== -1) {
            this.parseStatement();
            this.parseStatementList();
        }
        //ε production
        else {
            //Do nothing
        }
        this.CST.moveUp();
    }

    private parseStatement() {
        this.debug("Parsing Statement.");
        this.CST.addNode("statement");
        //Block
        if (this.currToken.kind === "SYM_L_BRACE") {
            this.parseBlock();
        }
        //VarDecl
        else if (this.currToken !== undefined && ["I_TYPE", "S_TYPE", "B_TYPE"].indexOf(this.currToken.kind) !== -1) {
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
        this.CST.moveUp();
    }

    private parsePrintStatement() {
        this.debug("Parsing PrintStatement.");
        this.CST.addNode("printStatement");
        this.match("PRINT", this.currToken);
        this.match("SYM_L_PAREN", this.currToken);
        this.parseExpression();
        this.match("SYM_R_PAREN", this.currToken);
        this.CST.moveUp();
    }

    private parseAssignmentStatement() {
        this.debug("Parsing AssignmentStatement.");
        this.CST.addNode("assignmentStatement");
        this.match("ID", this.currToken);
        this.match("SYM_ASSIGN", this.currToken);
        this.parseExpression();
    }

    private parseVariableDeclaration() {
        this.debug("Parsing VariableDeclaration.");
        this.CST.addNode("varDecl");
        this.parseType();
        this.match("ID", this.currToken);
    }

    private parseWhileStatement() {
        this.debug("Parsing WhileStatement.");
        this.CST.addNode("whileStatement");
        this.match("WHILE", this.currToken);
        this.parseBooleanExpression();
        this.parseBlock();
    }

    private parseIfStatement() {
        this.debug("Parsing IfStatement.");
        this.CST.addNode("ifStatement");
        this.match("IF", this.currToken);
        this.parseBooleanExpression();
        this.parseBlock();
    }

    private parseExpression() {
        this.debug("Parsing Expression.");
        this.CST.addNode("expr");
        switch (this.currToken.kind) {
            case "DIGIT": {
                this.parseIntegerExpression();
                break;
            }
            case "SYM_QUOTE": {
                this.parseStringExpression();
                break;
            }
            case "SYM_L_PAREN": {
                this.parseBooleanExpression();
                break;
            }
            case "ID": {
                this.match("ID", this.currToken);
            }
        }
    }

    private parseIntegerExpression() {
        this.debug("Parsing IntegerExpression.");
        this.CST.addNode("IntExpr");
        this.match("DIGIT", this.currToken);
        if (this.currToken.kind === "SYM_ADD") {
            this.match("SYM_ADD", this.currToken);
            this.parseExpression();
        }
        else {
            //Do nothing
            //A single digit is a valid IntegerExpression
        }
    }

    private parseStringExpression() {
        this.debug("Parsing StringExpression.");
        this.CST.addNode("StringExpr");
        this.match("SYM_QUOTE", this.currToken);
        this.parseCharList();
        this.match("SYM_QUOTE", this.currToken);
    }

    private parseBooleanExpression() {
        this.debug("Parsing BooleanExpression.");
        this.CST.addNode("BooleanExpr");
        this.match("SYM_L_PAREN", this.currToken);
        this.parseExpression();
        this.parseBooleanOperation();
        this.parseExpression();
        this.match("SYM_R_PAREN", this.currToken);
    }

    private parseID() {

    }

    private parseCharList() {
        this.debug("Parsing CharList.");
        this.CST.addNode("CharList");
        if (this.currToken.kind === "CHAR") {
            this.match("CHAR", this.currToken);
            if (this.currToken.kind === "CHAR") {
                this.parseCharList();
            }
            else {
                //do nothing
                //a single char is a valid charlist production
            }
        } 
        //ε production
        else {
            //Do nothing
        }
    }

    private parseType() {
        this.debug("Parsing Type.");

        this.CST.addNode("type");

        switch (this.currToken.kind) {
            case "I_TYPE": {
                this.match("I_TYPE", this.currToken);
                break;
            }
            case "S_TYPE": {
                this.match("S_TYPE", this.currToken);
                break;
            }
            case "B_TYPE": {
                this.match("B_TYPE", this.currToken);
                break;
            }
        }
    }

    private parseChar() {

    }

    private parseSpace() {

    }

    private parseDigit() {

    }

    private parseBooleanOperation() {
        this.debug("Parsing BooleanOperation.");
        this.CST.addNode("boolop");

        //a slightly modified version of match()
        //since a bool op only has two forms,
        //in order to allow for a more specific
        //error message
        if ("SYM_IS_EQUAL" === this.currToken.kind) {
            this.info("Found " + this.currToken.kind + " terminal");
        }
        else if ("SYM_IS_NOT_EQUAL" === this.currToken.kind) {
            this.info("Found " + this.currToken.kind + " terminal");
        }
        else {
            //There is an error
            this.err("Expected one of {SYM_IS_EQUAL, SYM_IS_NOT_EQUAL}, found " + this.currToken.kind + " [" + this.currToken.value + "] (" + this.currToken.line + ":" + this.currToken.position + ")");
            this.errors++;
        }
        this.currPos++;
        this.currToken = this.tokens[this.currPos];
    }

    private parseBooleanValue() {

    }

    private parseIntegerOperation() {

    }
}