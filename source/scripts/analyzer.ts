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

        this.printSymbolTable();

        return {errors: this.errors, warnings: this.warnings}
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
                switch (child.getName()) {
                    case "Block": {
                        this.currDepth++;
                        this.scopeTree.addNode(new HashTable(this.currDepth + ""));
                        this.currScope = this.scopeTree.getCurrent();
                        this.buildSymbolTable(child);
                        break;
                    }
                    case "VarDecl": {
                        let type = child.getChildren()[0];
                        let id = child.getChildren()[1];

                        if (!this.currScope.getTable().put(id.getValue(), type.getValue(), id.getLine(), this.currDepth)) {
                            this.err("Cannot declare the same ID twice: attempted to redeclare \"" + id.getValue() + "\"] on line " + id.getLine() + " when it was already declared.");
                            this.errors++;
                        }

                        break;
                    }
                    case "AssignmentStatement": {
                        let id = child.getChildren()[0];
                        let value = child.getChildren()[1];
                        let entryID = this.findID(id);
                        let entryVal;
                        let typeID = entryID.getType();
                        let typeVal;

                        if (value.getName() === "ID") {
                            entryVal = this.findID(value);
                            typeVal = entryVal.getType();
                        } else if (value.getValue() === "+") {
                            typeVal = this.checkAddChain(value.getChildren()[0], value.getChildren()[1])
                        } else {
                            typeVal = this.determineType(value.getValue());
                        }

                        if (value.getValue() === "+") {
                            if (!(typeID === typeVal)) {
                                this.err("Type mismatch on line " + id.getLine() + ": cannot assign type [" + typeVal + "] to type [" + typeID + "]");
                                this.errors++;
                            } else {
                                entryID.flipIsInit();
                                if (entryVal) {
                                    entryVal.flipBeenUsed();
                                }
                            }
                        }
                        else if (!this.checkType(id, value)) {
                            this.err("Type mismatch on line " + id.getLine() + ": cannot assign type [" + typeVal + "] to type [" + typeID + "]");
                            this.errors++;
                        } else {
                            entryID.flipIsInit();
                        }
                        
                        this.currScope = this.scopeTree.getCurrent();
                        break;
                    }
                    case "IfStatement": {}
                    case "WhileStatement": {
                        let keyword = child.getChildren()[0];
                        
                        //true and false literals don't need to be type checked
                        if (!(keyword.getValue() === "false" || keyword.getValue() === "true" )) {
                            let val1 = keyword.getChildren()[0];
                            let val2 = keyword.getChildren()[1];
                            let type1;
                            let type2;

                            if (val1.getName() === "ID") {
                                var entry1 = this.findID(val1);
                                type1 = entry1.getType();
                            } else if (val1.getValue() === "+") {
                                type1 = this.checkAddChain(val1.getChildren()[0], val1.getChildren()[1]);
                            } 
                            else {
                                type1 = this.determineType(val1.getValue())
                            }

                            if (val2.getName() === "ID") {
                                var entry2 = this.findID(val2);
                                type2 = entry2.getType();
                            } else if (val2.getValue() === "+") {
                                type2 = this.checkAddChain(val2.getChildren()[0], val2.getChildren()[1]);
                            } else {
                                type2 = this.determineType(val2.getValue());
                            }
                            

                            if (val1.getValue() === "+") {
                                if (!(type1 === type2)) {
                                    this.err("Type mismatch on line " + val1.getLine() + ": cannot compare type [" + type2 + "] to type [" + type1 + "]");
                                    this.errors++;
                                } else {
                                    //throws an error if the variable is not initialized; only applies to IDs
                                    if (entry1) {
                                        if (entry1.getInit()) {
                                            entry1.flipBeenUsed();
                                        } else {
                                            this.err("Uninitialized value: ID \"" + entry1.getID() + "\" on line " + entry1.getLine() + " was used, but its value was never initialized");
                                            this.errors++;
                                        }
                                    }
                                    
                                    if (entry2) {
                                        if (entry2.getInit()) {
                                            entry2.flipBeenUsed();
                                        } else {
                                            this.err("Uninitialized value: ID \"" + entry2.getID() + "\" on line " + entry2.getLine() + " was used, but its value was never initialized");
                                            this.errors++;
                                        }
                                    }
                                }
                            }
                            else if (val2.getValue() === "+") {
                                if (!(type1 === type2)) {
                                    this.err("Type mismatch on line " + val1.getLine() + ": cannot compare type [" + type2 + "] to type [" + type1 + "]");
                                    this.errors++;
                                } else {
                                    //throws an error if the variable is not initialized; only applies to IDs
                                    if (entry1) {
                                        if (entry1.getInit()) {
                                            entry1.flipBeenUsed();
                                        } else {
                                            this.err("Uninitialized value: ID \"" + entry1.getID() + "\" on line " + entry1.getLine() + " was used, but its value was never initialized");
                                            this.errors++;
                                        }
                                    }
                                    
                                    if (entry2) {
                                        if (entry2.getInit()) {
                                            entry2.flipBeenUsed();
                                        } else {
                                            this.err("Uninitialized value: ID \"" + entry2.getID() + "\" on line " + entry2.getLine() + " was used, but its value was never initialized");
                                            this.errors++;
                                        }
                                    }
                                }
                            }
                            else if (!this.checkType(val1, val2)) {
                                this.err("Type mismatch on line " + val1.getLine() + ": cannot compare type [" + type1 + "] to type [" + type2 + "]");
                                this.errors++;
                            } else {
                                //throws an error if the variable is not initialized; only applies to IDs
                                if (entry1) {
                                    if (entry1.getInit()) {
                                        entry1.flipBeenUsed();
                                    } else {
                                        this.err("Uninitialized value: ID \"" + entry1.getID() + "\" on line " + entry1.getLine() + " was used, but its value was never initialized");
                                        this.errors++;
                                    }
                                }
                                
                                if (entry2) {
                                    if (entry2.getInit()) {
                                        entry2.flipBeenUsed();
                                    } else {
                                        this.err("Uninitialized value: ID \"" + entry2.getID() + "\" on line " + entry2.getLine() + " was used, but its value was never initialized");
                                        this.errors++;
                                    }
                                }
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
                        let printVal = child.getChildren()[0];
                        if (printVal.getValue() === "+") {
                            //makes sure the addition statement has no error
                            this.checkAddChain(printVal.getChildren()[0], printVal.getChildren()[1])
                        }
                        else if (printVal.getName() === "ID") {
                            let entry = this.findID(printVal);
                            if (entry.getInit()) {
                                entry.flipBeenUsed();
                            } else {
                                this.err("Uninitialized value: ID \"" + entry.getID() + "\" on line " + entry.getLine() + " was declared, but its value was never initialized");
                                this.errors++;
                            }
                        } else {
                            //do nothing; any other expression type is valid
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

    private checkType(value1: TreeNode, value2: TreeNode) {
        var type1;
        var type2;
        if (value1.getName() === "ID") {
            type1 = (this.findID(value1)).getType();
        } else {
            type1 = this.determineType(value1.getValue());
        }

        if (value2.getValue() === "+") {
            type2 = this.checkAddChain(value2.getChildren()[0], value2.getChildren()[1]);
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
    }

    private checkAddChain(value1: TreeNode, value2: TreeNode) {
        var type1;
        var type2;
        if (value2.getValue() === "+") {
            return this.checkAddChain(value2.getChildren()[0], value2.getChildren()[1])
        } else if (value2.getName() === "ID") {
            type2 = (this.findID(value2)).getType();
        } else {
            type2 = this.determineType(value2.getValue());
        }

        if (value1.getName() === "ID") {
            type1 = (this.findID(value1)).getType();
        } else {
            type1 = this.determineType(value1.getValue());
        }

        if (type1 === type2) {
            return "int";
        } else {
            this.err("Type mismatch on line " + value1.getLine() + ": cannot add type [" + type2 + "] to type [" +type1+ "]")
            this.errors++;
            return type2;
        }

    }

    private determineType(val: string) {
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