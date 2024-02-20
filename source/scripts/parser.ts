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

        this.CST = new Tree("CST");

        this.currPos = 0;

        this.errors = 0;
        this.warnings = 0;
    }

    public parse() {
        this.currToken = this.tokens[this.currPos];
        this.parseProgram();
        
        return {concreteSyntaxTree: this.CST, errors: this.errors, warnings: this.warnings};
    }

    private match(desiredTokenKind: string, tokenToMatch: Token) {
        if (tokenToMatch) { //only checks if the tokenToMatch exists and is not undefined/null
            if (desiredTokenKind === tokenToMatch.kind) {
                this.info("Found " + tokenToMatch.kind + " [ " + tokenToMatch.value + " ] terminal, adding leaf node");

            }
            else {
                //There is an error
                this.err("at (" + tokenToMatch.line+ ":" + tokenToMatch.position + "): Expected {" + desiredTokenKind + "}, found " + tokenToMatch.kind + " [" + tokenToMatch.value + "]");
                this.errors++;
            }
            this.currPos++;
            this.currToken = this.tokens[this.currPos];
        }
    }

    private parseProgram() {
        this.CST.addNode("Program");
        this.parseBlock();
        this.match("EOP", this.currToken);
        this.CST.moveUp();//necessary to break the loop when printing the tree
    }

    private parseBlock() {
        this.CST.addNode("Block");
        this.debug("Parsing Block.");
        this.match("SYM_L_BRACE", this.currToken);
        this.parseStatementList();
        this.match("SYM_R_BRACE", this.currToken);
        this.CST.moveUp();
    }

    private parseStatementList() {
        this.debug("Parsing StatementList.");
        this.CST.addNode("StatementList");
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
        this.CST.addNode("Statement");
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
        this.CST.addNode("PrintStatement");
        this.match("PRINT", this.currToken);
        this.match("SYM_L_PAREN", this.currToken);
        this.parseExpression();
        this.match("SYM_R_PAREN", this.currToken);
        this.CST.moveUp();
    }

    private parseAssignmentStatement() {
        this.debug("Parsing AssignmentStatement.");
        this.CST.addNode("AssignmentStatement");
        this.match("ID", this.currToken);
        this.match("SYM_ASSIGN", this.currToken);
        this.parseExpression();
        this.CST.moveUp();
    }

    private parseVariableDeclaration() {
        this.debug("Parsing VariableDeclaration.");
        this.CST.addNode("VarDecl");
        this.parseType();
        this.match("ID", this.currToken);
        this.CST.moveUp();
    }

    private parseWhileStatement() {
        this.debug("Parsing WhileStatement.");
        this.CST.addNode("WhileStatement");
        this.match("WHILE", this.currToken);
        this.parseBooleanExpression();
        this.parseBlock();
        this.CST.moveUp();
    }

    private parseIfStatement() {
        this.debug("Parsing IfStatement.");
        this.CST.addNode("FfStatement");
        this.match("IF", this.currToken);
        this.parseBooleanExpression();
        this.parseBlock();
        this.CST.moveUp();
    }

    private parseExpression() {
        this.debug("Parsing Expression.");
        this.CST.addNode("Expr");
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
        this.CST.moveUp();
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
        this.CST.moveUp();
    }

    private parseStringExpression() {
        this.debug("Parsing StringExpression.");
        this.CST.addNode("StringExpr");
        this.match("SYM_QUOTE", this.currToken);
        this.parseCharList();
        this.match("SYM_QUOTE", this.currToken);
        this.CST.moveUp();
    }

    private parseBooleanExpression() {
        this.debug("Parsing BooleanExpression.");
        this.CST.addNode("BooleanExpr");
        this.match("SYM_L_PAREN", this.currToken);
        this.parseExpression();
        this.parseBooleanOperation();
        this.parseExpression();
        this.match("SYM_R_PAREN", this.currToken);
        this.CST.moveUp();
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
        this.CST.moveUp();
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
        this.CST.moveUp();
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
            this.CST.moveUp();
        }
        else if ("SYM_IS_NOT_EQUAL" === this.currToken.kind) {
            this.info("Found " + this.currToken.kind + " terminal");
            this.CST.moveUp();
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