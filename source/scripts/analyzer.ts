//semantic analyzer
class SemanticAnalyzer extends Component {
    
    private CST: Tree;
    private tokens: Array<Token>;
    private AST: Tree;


    private scopeTree: HashTree;
    private currDepth: number = -1;
    private currScope: HashNode;

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
        console.log(this.AST.getRoot())
        this.buildSymbolTable(this.AST.getRoot())
    }

    public buildScopeTree(node: TreeNode) {
        if (node.getChildren().length === 0) {

            return;
        }

        node.getChildren().forEach(child => {
            switch (node.getName()) {
                case "Block": {
                    this.currDepth++;
                    this.scopeTree.addNode(new HashTable(this.currDepth + ""));
                    this.currScope = this.scopeTree.getCurrent();
                    this.buildScopeTree(child);
                }
                case "VarDecl": {
                    var type = child.getChildren()[0];
                    var id = child.getChildren()[1];

                    this.currScope.getTable().put(id.getValue(), type.getValue());
                }
            }
        });

        this.currDepth--;
        this.moveUp();
        return;
    }

    private buildSymbolTable() {

    }

    private printSymbolTable() {

    }

    private moveUp() {
        this.scopeTree.moveUp();
        this.currScope = this.scopeTree.getCurrent();
    }
    
}