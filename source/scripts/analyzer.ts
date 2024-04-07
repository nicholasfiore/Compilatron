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

        this.scopeTree = new HashTree("Scope");
        console.log(this.AST.getRoot());
        this.buildSymbolTable(this.AST.getRoot())
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

                        this.currScope.getTable().put(id.getValue(), type.getValue(), id.getLine());
                        break;
                    }
                    case "AssignmentStatement": {
                        let id = child.getChildren()[0];
                        let value = child.getChildren()[1];

                        if (!this.checkType(id.getValue(), value.getValue())) {
                            this.err("type mismatch")
                            this.errors++;
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

    private checkType(id: string, value: string) {
        var entry = this.currScope.getTable().get(id);
        switch (entry.getType()) {
            case "int": {
                return this.validInt.test(value);
            }
            case "": {

            }
        }
    }

    // private buildSymbolTable() {
        
    // }

    private printSymbolTable() {

    }

    private moveUp() {
        this.scopeTree.moveUp();
        this.currScope = this.scopeTree.getCurrent();
    }
    
}