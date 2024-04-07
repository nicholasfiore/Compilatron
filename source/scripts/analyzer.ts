//semantic analyzer
class SemanticAnalyzer extends Component {
    
    private CST: Tree;
    private tokens: Array<Token>;
    private AST: Tree;

    private errors: number;
    private warnings: number;

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
        this.info("Abstract Syntax Tree:");
        console.log(this.AST.getRoot());
        this.AST.printTree(this.AST.getRoot());
        this.info("End AST\n");

        this.scopeTree = new HashTree("Scope");
        console.log(this.AST.getRoot());
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
                console.log(this.currScope);
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
                            this.err("redeclaration");
                            this.errors++;
                        }
                        break;
                    }
                    case "AssignmentStatement": {
                        let id = child.getChildren()[0];
                        let value = child.getChildren()[1];

                        if (!this.checkType(id, value)) {
                            this.err("type mismatch, value: " + value.getValue());
                            this.errors++;
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

                            if (!this.checkType(val1, val2)) {
                                this.err("type mismatch");
                                this.errors++;
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
                            this.findID(printVal.getValue());
                        }
                        break;
                    }
                }
                console.log(this.scopeTree.getRoot());
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
            type1 = (this.findID(value1.getValue())).getType();
        } else {
            type1 = this.determineType(value1.getValue());
        }

        if (value2.getName() === "ID") {
            type2 = (this.findID(value2.getValue())).getType();
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
        if (this.validInt.test(val)) {
            return "int";
        } else if (this.validString.test(val)) {
            return "string";
        } else if (this.validBoolVal.test(val)) {
            return "boolean";
        }
    }

    //looks for the ID in scope recursively
    private findID(id: string) {
        var retVal;
        var entry = this.currScope.getTable().get(id);
        if (entry) {
            retVal = entry;
        } else {
            var lookUpSuccess = this.lookUp();
            if (lookUpSuccess) {
                retVal = this.findID(id);
            } else {
                this.err("undeclared")
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
                    this.info(entry.getID() + " " + entry.getType() + " " + entry.getLine() + " " + entry.getScope())
                }
            });
        });

    }

    private moveUp() {
        this.scopeTree.moveUp();
        this.currScope = this.scopeTree.getCurrent();
    }
    
}