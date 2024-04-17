//semantic analyzer
class SemanticAnalyzer extends Component {
    
    private CST: Tree;
    //private tokens: Array<Token>;
    private AST: Tree;

    private errors: number = 0;
    private warnings: number = 0;

    private scopeTree: HashTree;
    private currDepth: number = -1;
    private currScope: HashNode;
    private currScopeLabel: string;

    private repeatScope: string[] = new Array<string>;

    private validInt = new RegExp('^[0-9]$');
    private validString = new RegExp('[a-z]');
    private validBoolVal = new RegExp('^true$|^false$');
    
    private table;

    constructor(ConcreteSyntaxTree: Tree, enableDebug: boolean) {
        super("Semantic Analyzer", enableDebug);
        this.AST = new Tree("AST");
        this.CST = ConcreteSyntaxTree;
    }

    public analyze() {
        this.AST.buildAST(this.CST.getRoot());

        this.info("\nAbstract Syntax Tree:");

        this.AST.printTree(this.AST.getRoot());
        this.info("End AST\n");

        this.scopeTree = new HashTree("Scope");

        this.buildSymbolTable(this.AST.getRoot());

        var table = this.printSymbolTable();

        return {AST: this.AST, symbolTable: this.table, errors: this.errors, warnings: this.warnings}
    }

    public buildSymbolTable(node: TreeNode) {
        if (node.getChildren().length === 0) {
            
            return;
        }

        if (this.currDepth < 0) {
            this.currDepth++;
            this.repeatScope[0] = "";
            this.scopeTree.addNode(new HashTable(this.currDepth + ""));
            this.currScope = this.scopeTree.getCurrent();
            this.buildSymbolTable(node);
        } else {
            node.getChildren().forEach(child => {
                switch (child.getName()) {
                    case "Block": {
                        this.currDepth++;
                        this.currScopeLabel = this.labelScope(this.currDepth);
                        this.scopeTree.addNode(new HashTable(this.currScopeLabel));
                        this.currScope = this.scopeTree.getCurrent();
                        this.buildSymbolTable(child);
                        break;
                    }
                    case "VarDecl": {
                        let type = child.getChildren()[0];
                        let id = child.getChildren()[1];

                        if (!this.currScope.getTable().put(id.getValue(), type.getValue(), id.getLine(), this.currScopeLabel)) {
                            this.err("Cannot declare the same ID twice: attempted to redeclare \"" + id.getValue() + "\" on line " + id.getLine() + " when it was already declared.");
                            this.errors++;
                        }

                        break;
                    }
                    case "AssignmentStatement": {
                        let id = child.getChildren()[0];
                        let value = child.getChildren()[1];

                        if (!this.checkType(id, value)) {
                            this.err("Type mismatch, line " + id.getLine() + " : cannot assign [" + this.determineType(value) + "] to [" + this.determineType(id) + "]")
                            this.errors++;
                        } else {
                            this.findID(id).flipIsInit();
                        }
                        break;
                    }
                    case "IfStatement": {}
                    case "WhileStatement": {
                        let keyword = child.getChildren()[0];

                        this.determineType(keyword) //ensures the keyword is proper boolean
                        //block code
                        this.currDepth++;
                        this.scopeTree.addNode(new HashTable(this.currDepth + ""));
                        this.currScope = this.scopeTree.getCurrent();
                        this.buildSymbolTable(child);
                        break;
                    }
                    case "PrintStatement": {
                        let printVal = child.getChildren()[0];
                        this.determineType(printVal);
                        if (printVal.getName() === "ID") {
                            this.findID(printVal).flipBeenUsed();
                        }
                        break;
                    }
                }
            });
        this.currDepth--;
        this.moveUp();
        }
    }

    private labelScope(depth:number) {
        let currSubLabel;
        if (this.repeatScope.length-1 < depth) {
            this.repeatScope.push("a");
            currSubLabel = this.repeatScope[depth];
        } else {
            currSubLabel = this.repeatScope[depth];
            let temp = currSubLabel.charCodeAt(0);
            currSubLabel = String.fromCharCode(temp + 1);
            this.repeatScope[depth] = currSubLabel;
        }
        
        // for (let i = currSubLabel.length-1; i > 0; i--) {
        //     if (currSubLabel.charCodeAt(currSubLabel.length-1) >= 90) {
        //         //increments to the next letter
        //         let temp = currSubLabel.charCodeAt(i);
        //         let currLetter = String.fromCharCode(temp + 1);
        //         currSubLabel = this.replaceChar(currSubLabel, currLetter, i);
        //     }
        // }
        return depth + currSubLabel;
        // let temp = currLetter.charCodeAt(currLetter.length - 1) + 1;
        // currLetter = String.fromCharCode(temp);
        
    }

    //Taken from https://www.geeksforgeeks.org/how-to-replace-a-character-at-a-particular-index-in-javascript/
    private replaceChar(origString, replaceChar, index) {
        let firstPart = origString.substr(0, index);
        let lastPart = origString.substr(index + 1);
          
        let newString = firstPart + replaceChar + lastPart;
        return newString;
    }

    private evaluateBoolean(value1: TreeNode, value2: TreeNode) {
        if (!this.checkType(value1, value2)) {
            this.err("Type mismatch, line " + value1.getLine() + ": cannot compare [" + this.determineType(value1) + "] to [" + this.determineType(value2) + "]")
            this.errors++;
            return "error";
        } else {
            return "boolean";
        }
    }

    private checkType(value1: TreeNode, value2: TreeNode) {
        let type1 = this.determineType(value1);
        let type2 = this.determineType(value2);

        if (type1 == type2) {
            return true;
        } else {
            return false;
        }
    }

    private checkAddChain(value1: TreeNode, value2: TreeNode) {
        if (value2.getName() === "SYM_ADD") {
            return this.checkAddChain(value2.getChildren()[0], value2.getChildren()[1])
        }
        else if (!this.checkType(value1, value2)) {
            this.err("Type mismatch, line " + value1.getLine() + ": cannot add [" + this.determineType(value2) + "] to [" + this.determineType(value1) + "]")
            this.errors++;
            return "error";
        } else {
            return "int";
        }
    }    

    private determineType(val: TreeNode) {
        let child1 = val.getChildren()[0];
        let child2 = val.getChildren()[1];
        if (val.getName() === "SYM_ADD") {
            if (child2.getName() === "ID") {
                if (!this.findID(child2).getInit()) {
                    this.err("Uninitialized value: ID \"" + child2.getValue() + "\" at line " + child2.getLine() + " was used before being initialized")
                    this.errors++;
                } else {
                    this.findID(child2).flipBeenUsed();
                }
            }
            return this.checkAddChain(child1, child2);
        } else if (val.getName() === "SYM_IS_EQUAL" || val.getName() === "SYM_IS_NOT_EQUAL") {
            console.log("here1")
            if (child1.getName() === "ID") {
                if (!this.findID(child1).getInit()) {
                    this.err("Uninitialized value: ID \"" + child1.getValue() + "\" at line " + child1.getLine() + " was used before being initialized")
                    this.errors++;
                } else {
                    this.findID(child1).flipBeenUsed();
                }
            } else if (child1.getName() === "SYM_ADD") {
                this.checkAddChain(child1.getChildren()[0], child1.getChildren()[1]);
            }
            if (child2.getName() === "ID") {
                if (!this.findID(child2).getInit()) {
                    this.err("Uninitialized value: ID \"" + child2.getValue() + "\" at line " + child2.getLine() + " was used before being initialized")
                    this.errors++;
                } else {
                    this.findID(child2).flipBeenUsed();
                }
            } else if (child2.getName() === "SYM_ADD") {
                this.checkAddChain(child2.getChildren()[0], child2.getChildren()[1]);
            }
            return this.evaluateBoolean(child1, child2)
        } else if (val.getName() === "ID") {
            return this.findID(val).getType();
        } else {
            if (this.validInt.test(val.getValue())) {
                return "int";
            } else if (this.validBoolVal.test(val.getValue())) {
                return "boolean";
            } else if (this.validString.test(val.getValue())) {
                return "string";
            } 
        }


        
    }

    //looks for the ID in scope recursively
    private findID(id: TreeNode) {
        let scope = this.currScope;
        var retVal;

        var entry = this.currScope.getTable().get(id.getValue());
        if (entry) {
            retVal = entry;
        } else {
            var lookUpSuccess = this.lookUp();
            if (lookUpSuccess) {
                retVal = this.findID(id);
            } else {
                this.err("Undeclared variable: The ID \"" + id.getValue() + "\" on line " + id.getLine() + " was used but not declared")
                this.errors++;
                retVal = null;
            }
        }
        this.currScope = scope;
        return retVal;
    }

    private lookUp() {
        if (this.currScope.getParent()) {
            this.currScope = this.currScope.getParent();
            return true;
        } else {
            return false;
        }
    }

    private printSymbolTable() {
        var queue = [this.scopeTree.getRoot()];
        var result: Array<HashNode> = [];
        var currNode: HashNode;
        //var tableObj: Table;

        this.table = new Table("Symbol Table");

        while (queue.length > 0) {
            currNode = queue.shift();
            result.push(currNode);
            
            if (currNode.getChildren().length === 0) {
                continue;
            }

            for (var i = 0; i < currNode.getChildren().length; i++) {
                queue.push(currNode.getChildren()[i]);
            }
        }

        result.forEach(node => {
            let table = node.getTable().getEntries();
            table.forEach(entry => {
                if (typeof entry !== undefined) {
                    //this.info(entry.getID() + " " + entry.getType() + " " + entry.getLine() + " " + entry.getScope())
                    this.table.addEntry(entry);
                    if (!entry.getInit()) {
                        this.warn("ID \"" + entry.getID() + "\" was declared but never initialized");
                        this.warnings++;
                    } else if (!entry.getBeenUsed()) {
                        this.warn("ID \"" + entry.getID() + "\" was declared and initialized but never used")
                        this.warnings++;
                    }
                }
            });
        });

        if (this.errors < 1) {
            this.table.printTable();
        }
    }

    private moveUp() {
        this.scopeTree.moveUp();
        this.currScope = this.scopeTree.getCurrent();
    }
    
}

class Table extends Component {

    private table: Array<HashEntry>;

    constructor(name: string) {
        super(name, false)
        this.table = new Array<HashEntry>;
    }

    public getTable() {
        return this.table;
    }

    public addEntry(entry: HashEntry) {
        this.table.push(entry);
    }

    public printTable() {
        console.table(this.table)
        var output = "";

        var typeSpacing;
        var lineSpacing;
        var lineHeaderSpacing = "";
        var initSpacing;

        

        //this.info("ID | Type | Scope | Line | IsInit | BeenUsed")
        this.table.forEach(entry => {

            if (entry.getType() === "int") {
                typeSpacing = "    ";
            } else if (entry.getType() === "string") {
                typeSpacing = " ";
            }

            if (entry.getInit() === "true") {
                initSpacing = "   ";
            } else {
                initSpacing = "  ";
            }

            output += entry.getID() + "  | " + entry.getType() + typeSpacing + " | " + entry.getScope()
            + "     | " + entry.getLine() + "    | " + entry.getInit() + initSpacing + " | " + entry.getBeenUsed() + "\n"
            
            typeSpacing = "";
        });

        var header = "\nID | TYPE    | SCOPE | LINE | IsINIT? | BeenUSED?\n";
        output = header + output;
        //only bother printing the table if there are any variables, otherwise skip
        if (this.table.length > 0) {
            this.info(output);
        }
        return this.table;
    }
}