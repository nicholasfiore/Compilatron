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

    private validInt = new RegExp('^[0-9]$');
    private validString = new RegExp('[a-z]');
    private validBoolVal = new RegExp('^true$|^false$');

    constructor(ConcreteSyntaxTree: Tree, /*TokenStream: Array<Token>,*/ enableDebug: boolean) {
        super("Semantic Analyzer", enableDebug);
        this.AST = new Tree("AST");
        this.CST = ConcreteSyntaxTree;
        //this.tokens = TokenStream;
    }

    public analyze() {
        this.AST.buildAST(this.CST.getRoot());
        //this.buildAST();
        this.info("\nAbstract Syntax Tree:");
        //console.log(this.AST.getRoot());
        this.AST.printTree(this.AST.getRoot());
        this.info("End AST\n");

        this.scopeTree = new HashTree("Scope");
        //console.log(this.AST.getRoot());
        this.buildSymbolTable(this.AST.getRoot());

        this.printSymbolTable();
    }

    public buildSymbolTable(node: TreeNode) {
        if (node.getChildren().length === 0) {

            return;
        }

        if (this.currDepth < 0) {
            this.currDepth++;
            this.scopeTree.addNode(new HashTable(this.currDepth + ""));
            this.currScope = this.scopeTree.getCurrent();
            this.buildSymbolTable(node);
        } else {
            node.getChildren().forEach(child => {
                //console.log(this.currScope);
                switch (child.getName()) {
                    case "Block": {
                        this.currDepth++;
                        this.scopeTree.addNode(new HashTable(this.currDepth + ""));
                        this.currScope = this.scopeTree.getCurrent();
                        this.buildSymbolTable(child);
                        break;
                    }
                    case "VarDecl": {
                        //console.log(child)
                        let type = child.getChildren()[0];
                        let id = child.getChildren()[1];

                        if (!this.currScope.getTable().put(id.getValue(), type.getValue(), id.getLine(), this.currDepth)) {
                            this.err("Cannot declare the same ID twice. Attempted to redeclare \"" + id.getValue() + "\"] on line " + id.getLine() + " when it was already declared.");
                            this.errors++;
                        }

                        break;
                    }
                    case "AssignmentStatement": {
                        let id = child.getChildren()[0];
                        let value = child.getChildren()[1];
                        let entry = this.findID(id);

                        if (!this.checkType(id, value)) {
                            this.err("Type mismatch on line " + id.getLine() + ": cannot assign type [" + this.determineType(value.getValue()) + "] to type [" + this.determineType(id.getValue()) + "]");
                            this.errors++;
                        } else {
                            entry.flipIsInit();
                        }
                        
                        this.currScope = this.scopeTree.getCurrent();
                        break;
                    }
                    case "IfStatement": {}
                    case "WhileStatement": {
                        let keyword = child.getChildren()[0];
                        
                        //true and false don't need to be type checked
                        if (!(keyword.getValue() === "false" || keyword.getValue() === "true" )) {
                            let val1 = keyword.getChildren()[0];
                            let val2 = keyword.getChildren()[1];
                            let entry1 = this.findID(val1);
                            let entry2 = this.findID(val2);

                            if (!this.checkType(val1, val2)) {
                                this.err("Type mismatch on line " + val1.getLine() + ": cannot compare type [" + this.determineType(val1.getValue()) + "] to type [" + this.determineType(val2.getValue()) + "]");
                                this.errors++;
                            } else {
                                entry1.flipBeenUsed();
                                entry2.flipBeenUsed();
                            }
                        }
                        //block code
                        this.currDepth++;
                        this.scopeTree.addNode(new HashTable(this.currDepth + ""));
                        this.currScope = this.scopeTree.getCurrent();
                        this.buildSymbolTable(child);
                        break;
                    }
                    case "PrintStatement": {
                        let printVal = child.getChildren()[0]
                        if (printVal.getName() === "ID") {
                            this.findID(printVal);
                        }
                        break;
                    }
                }
                //console.log(this.scopeTree.getRoot());
            });
            this.currDepth--;
            this.moveUp();
        }
        
        return;
    }

    // private checkScope(id) {
    //     var entry = this.currScope.getTable().get(id);
    //     if (entry) {
            
    //     } else {
    //         var retVal;
    //         var lookUpSuccess = this.lookUp();
    //         if (lookUpSuccess) {
    //             retVal = this.checkScope(id);
    //         } else {
    //             this.err("undeclared")
    //             this.errors++;
    //             retVal = false;
    //         }
    //         return retVal;
    //     }
        
    // }

    private checkType(value1: TreeNode, value2: TreeNode) {
        var type1;
        var type2;
        if (value1.getName() === "ID") {
            type1 = (this.findID(value1)).getType();
        } else {
            type1 = this.determineType(value1.getValue());
        }

        if (value2.getValue() === "+") {
            return this.checkType(value2.getChildren()[0], value2.getChildren()[1]);
        } else if (value2.getName() === "ID") {
            type2 = (this.findID(value2)).getType();
        } else {
            type2 = this.determineType(value2.getValue());
        }

        if (type1 === type2) {
            return true;
        } else {
            return false;
        }

        // var entry = this.currScope.getTable().get(value1);
        // if (entry) {
        //     switch (entry.getType()) {
        //         case "int": {
        //             return this.validInt.test(value2);
        //         }
        //         case "string": {
        //             return this.validString.test(value2);
        //         }
        //         case "boolean": {
        //             return this.validBoolVal.test(value2);
        //         }
        //     }
        // }
    }

    private determineType(val: string) {
        //TODO: fixing adding

        if (this.validInt.test(val)) {
            return "int";
        }else if (this.validBoolVal.test(val)) {
            return "boolean";
        } else if (this.validString.test(val)) {
            return "string";
        } 
    }

    //looks for the ID in scope recursively
    private findID(id: TreeNode) {
        var retVal;

        var entry = this.currScope.getTable().get(id.getValue());
        if (entry) {
            retVal = entry;
        } else {
            var lookUpSuccess = this.lookUp();
            if (lookUpSuccess) {
                retVal = this.findID(id);
            } else {
                this.err("The ID \"" + id.getValue() + "\" on line " + id.getLine() + " was used before being declared")
                this.errors++;
                retVal = false;
            }
        }
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

    //private 

    // private buildSymbolTable() {
        
    // }

    private printSymbolTable() {
        var queue = [this.scopeTree.getRoot()];
        var result: Array<HashNode> = [];
        var currNode: HashNode;
        var tableObj: Table;

        tableObj = new Table("Symbol Table");

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
                    tableObj.addEntry(entry);
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
            tableObj.printTable();
        }
    }

    private moveUp() {
        this.scopeTree.moveUp();
        this.currScope = this.scopeTree.getCurrent();
    }
    
}

class Table extends Component {

    table: Array<HashEntry>;

    constructor(name: string) {
        super(name, false)
        this.table = new Array<HashEntry>;
    }

    addEntry(entry: HashEntry) {
        this.table.push(entry);
    }

    printTable() {
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

            // let temp = entry.getLine() + "";
            // switch (temp.length) {
            //     case 1:
            //         lineSpacing = "   "
            //         break;
            //     case 2:
            //         lineSpacing = "  "
            //         break;
            //     case 3:
            //         lineSpacing = " ";
            //         break;
            //     default:
            //         lineSpacing = "";
            //         for (var i = 0; i < (temp.length - 4); i++) {
            //             lineHeaderSpacing += " ";
            //         }

            // }

            output += entry.getID() + "  | " + entry.getType() + typeSpacing + " | " + entry.getScope()
            + "     | " + entry.getLine() + "    | " + entry.getInit() + initSpacing + " | " + entry.getBeenUsed() + "\n"
            
            typeSpacing = "";
        });

        var header = "\nID | TYPE    | SCOPE | LINE | IsINIT? | BeenUSED?\n";
        output = header + output;
        this.info(output);
    }
}