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

    // public buildSymbolTable(node: TreeNode) {
    //     if (node.getChildren().length === 0) {

    //         return;
    //     }

    //     if (this.currDepth < 0) {
    //         this.currDepth++;
    //         this.scopeTree.addNode(new HashTable(this.currDepth + ""));
    //         this.currScope = this.scopeTree.getCurrent();
    //         this.buildSymbolTable(node);
    //     } else {
    //         node.getChildren().forEach(child => {
    //             switch (child.getName()) {
    //                 case "Block": {
    //                     this.currDepth++;
    //                     this.scopeTree.addNode(new HashTable(this.currDepth + ""));
    //                     this.currScope = this.scopeTree.getCurrent();
    //                     this.buildSymbolTable(child);
    //                     break;
    //                 }
    //                 case "VarDecl": {
    //                     let type = child.getChildren()[0];
    //                     let id = child.getChildren()[1];

    //                     if (!this.currScope.getTable().put(id.getValue(), type.getValue(), id.getLine(), this.currDepth)) {
    //                         this.err("Cannot declare the same ID twice: attempted to redeclare \"" + id.getValue() + "\" on line " + id.getLine() + " when it was already declared.");
    //                         this.errors++;
    //                     }

    //                     break;
    //                 }
    //                 case "AssignmentStatement": {
    //                     let id = child.getChildren()[0];
    //                     let value = child.getChildren()[1];
    //                     let entryID = this.findID(id);
    //                     let entryVal;
    //                     let typeID = entryID.getType();
    //                     let typeVal;
    //                     let foundBool;

    //                     if (value.getName() === "ID") {
    //                         entryVal = this.findID(value);
    //                         typeVal = entryVal.getType();
    //                     } else if (value.getValue() === "==" || value.getValue() === "!=") {
    //                         typeVal = "boolean";
    //                         foundBool = true;
    //                     } 
    //                     else if (value.getValue() === "+") {
    //                         typeVal = this.checkAddChain(value.getChildren()[0], value.getChildren()[1]);
    //                         if (!typeVal) {
    //                             return;
    //                         }
    //                     } else {
    //                         typeVal = this.determineType(value.getValue());
    //                     }

    //                     if (value.getValue() === "+") {
    //                         if (!(typeID === typeVal)) {
    //                             this.err("Type mismatch on line " + id.getLine() + ": cannot assign type [" + typeVal + "] to type [" + typeID + "]");
    //                             this.errors++;
    //                         } else {
    //                             entryID.flipIsInit();
    //                             if (entryVal) {
    //                                 entryVal.flipBeenUsed();
    //                             }
    //                         }
    //                     }
    //                     else if (foundBool) {
    //                         if (!entryID.getInit()) {
    //                             console.log("here")
    //                             entryID.flipIsInit();
    //                         } else {
    //                             entryID.flipBeenUsed();
    //                         }
    //                     }
    //                     else if (!this.checkType(id, value)) {
    //                         this.err("Type mismatch on line " + id.getLine() + ": cannot assign type [" + typeVal + "] to type [" + typeID + "]");
    //                         this.errors++;
    //                     } else {
    //                         if (!entryID.getInit()) {
    //                             entryID.flipIsInit();
    //                         } else {
    //                             entryID.flipBeenUsed();
    //                         }
    //                     }
                        
    //                     this.currScope = this.scopeTree.getCurrent();
    //                     break;
    //                 }
    //                 case "IfStatement": {}
    //                 case "WhileStatement": {
    //                     let keyword = child.getChildren()[0];
                        
    //                     //true and false literals don't need to be type checked
    //                     if (!(keyword.getValue() === "false" || keyword.getValue() === "true" )) {
    //                         let val1 = keyword.getChildren()[0];
    //                         let val2 = keyword.getChildren()[1];
    //                         let type1;
    //                         let type2;

    //                         if (val1.getName() === "ID") {
    //                             var entry1 = this.findID(val1);
    //                             type1 = entry1.getType();
    //                         } else if (val1.getValue() === "+") {
    //                             type1 = this.checkAddChain(val1.getChildren()[0], val1.getChildren()[1]);
    //                         } 
    //                         else {
    //                             type1 = this.determineType(val1.getValue())
    //                         }

    //                         if (val2.getName() === "ID") {
    //                             var entry2 = this.findID(val2);
    //                             type2 = entry2.getType();
    //                         } else if (val2.getValue() === "+") {
    //                             type2 = this.checkAddChain(val2.getChildren()[0], val2.getChildren()[1]);
    //                         } else {
    //                             type2 = this.determineType(val2.getValue());
    //                         }
                            

    //                         if (val1.getValue() === "+") {
    //                             if (!(type1 === type2)) {
    //                                 this.err("Type mismatch on line " + val1.getLine() + ": cannot compare type [" + type2 + "] to type [" + type1 + "]");
    //                                 this.errors++;
    //                             } else {
    //                                 //throws an error if the variable is not initialized; only applies to IDs
    //                                 if (entry1) {
    //                                     if (entry1.getInit()) {
    //                                         entry1.flipBeenUsed();
    //                                     } else {
    //                                         this.err("Uninitialized value: ID \"" + entry1.getID() + "\" on line " + entry1.getLine() + " was used, but its value was never initialized");
    //                                         this.errors++;
    //                                     }
    //                                 }
                                    
    //                                 if (entry2) {
    //                                     if (entry2.getInit()) {
    //                                         entry2.flipBeenUsed();
    //                                     } else {
    //                                         this.err("Uninitialized value: ID \"" + entry2.getID() + "\" on line " + entry2.getLine() + " was used, but its value was never initialized");
    //                                         this.errors++;
    //                                     }
    //                                 }
    //                             }
    //                         }
    //                         else if (val2.getValue() === "+") {
    //                             if (!(type1 === type2)) {
    //                                 this.err("Type mismatch on line " + val1.getLine() + ": cannot compare type [" + type2 + "] to type [" + type1 + "]");
    //                                 this.errors++;
    //                             } else {
    //                                 //throws an error if the variable is not initialized; only applies to IDs
    //                                 if (entry1) {
    //                                     if (entry1.getInit()) {
    //                                         entry1.flipBeenUsed();
    //                                     } else {
    //                                         this.err("Uninitialized value: ID \"" + entry1.getID() + "\" on line " + entry1.getLine() + " was used, but its value was never initialized");
    //                                         this.errors++;
    //                                     }
    //                                 }
                                    
    //                                 if (entry2) {
    //                                     if (entry2.getInit()) {
    //                                         entry2.flipBeenUsed();
    //                                     } else {
    //                                         this.err("Uninitialized value: ID \"" + entry2.getID() + "\" on line " + entry2.getLine() + " was used, but its value was never initialized");
    //                                         this.errors++;
    //                                     }
    //                                 }
    //                             }
    //                         }
    //                         else if (!this.checkType(val1, val2)) {
    //                             this.err("Type mismatch on line " + val1.getLine() + ": cannot compare type [" + type1 + "] to type [" + type2 + "]");
    //                             this.errors++;
    //                         } else {
    //                             //throws an error if the variable is not initialized; only applies to IDs
    //                             if (entry1) {
    //                                 if (entry1.getInit()) {
    //                                     entry1.flipBeenUsed();
    //                                 } else {
    //                                     this.err("Uninitialized value: ID \"" + entry1.getID() + "\" on line " + entry1.getLine() + " was used, but its value was never initialized");
    //                                     this.errors++;
    //                                 }
    //                             }
                                
    //                             if (entry2) {
    //                                 if (entry2.getInit()) {
    //                                     entry2.flipBeenUsed();
    //                                 } else {
    //                                     this.err("Uninitialized value: ID \"" + entry2.getID() + "\" on line " + entry2.getLine() + " was used, but its value was never initialized");
    //                                     this.errors++;
    //                                 }
    //                             }


    //                         }
    //                     }
    //                     //block code
    //                     this.currDepth++;
    //                     this.scopeTree.addNode(new HashTable(this.currDepth + ""));
    //                     this.currScope = this.scopeTree.getCurrent();
    //                     this.buildSymbolTable(child);
    //                     break;
    //                 }
    //                 case "PrintStatement": {
    //                     let printVal = child.getChildren()[0];
    //                     if (printVal.getValue() === "+") {
    //                         //makes sure the addition statement has no error
    //                         this.checkAddChain(printVal.getChildren()[0], printVal.getChildren()[1])
    //                     }
    //                     else if (printVal.getName() === "ID") {
    //                         let entry = this.findID(printVal);
    //                         if (entry.getInit()) {
    //                             entry.flipBeenUsed();
    //                         } else {
    //                             this.err("Uninitialized value: ID \"" + entry.getID() + "\" on line " + entry.getLine() + " was used, but its value was never initialized");
    //                             this.errors++;
    //                         }
    //                     } else {
    //                         //do nothing; any other expression type is valid
    //                     }
    //                     break;
    //                 }
    //             }
    //             //console.log(this.scopeTree.getRoot());
    //         });
    //         this.currDepth--;
    //         this.moveUp();
    //     }
        
    //     return;
    // }
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
    
    return;
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

    // private checkType(value1: TreeNode, value2: TreeNode) {
    //     var type1;
    //     var type2;
    //     if (value1.getName() === "ID") {
    //         type1 = (this.findID(value1)).getType();
    //     } else {
    //         type1 = this.determineType(value1.getValue());
    //     }

    //     if (value2.getValue() === "+") {
    //         type2 = this.checkAddChain(value2.getChildren()[0], value2.getChildren()[1]);
    //     } else if (value2.getName() === "ID") {
    //         type2 = (this.findID(value2)).getType();
    //     } else {
    //         type2 = this.determineType(value2.getValue());
    //     }

    //     if (type1 === type2) {
    //         return true;
    //     } else {
    //         return false;
    //     }
    // }

    // private checkAddChain(value1: TreeNode, value2: TreeNode) {
    //     var type1;
    //     var type2;

    //     if (value2.getValue() === "+") {
    //         return this.checkAddChain(value2.getChildren()[0], value2.getChildren()[1])
    //     } else if (value2.getName() === "ID") {
    //         let entry = (this.findID(value2))
    //         if (!entry.getInit()) {
    //             this.err("Uninitialized value: ID \"" + entry.getID() + "\" on line " + entry.getLine() + " was used, but its value was never initialized")
    //             this.errors++;
    //             return false;
    //         } else {
    //             type2 = entry.getType();
    //             this.findID(value2).flipBeenUsed();
    //         }
            
    //     } else {
    //         type2 = this.determineType(value2);
    //     }

    //     if (value1.getName() === "ID") {
    //         let entry = (this.findID(value1))
    //         if (!entry.getInit()) {
    //             this.err("Uninitialized value: ID \"" + entry.getID() + "\" on line " + entry.getLine() + " was used, but its value was never initialized")
    //             this.errors++;
    //         } else {
    //             type1 = entry.getType();
    //         }
            
    //     } else {
    //         type1 = this.determineType(value1);
    //     }

    //     if (type1 === type2) {
    //         return "int";
    //     } else {
    //         this.err("Type mismatch on line " + value1.getLine() + ": cannot add type [" + type2 + "] to type [" +type1+ "]")
    //         this.errors++;
    //         return type2;
    //     }

    // }

    

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
        //only bother printing the table if there are any variables, otherwise skip
        if (this.table.length > 0) {
            this.info(output);
        }
        
    }
}