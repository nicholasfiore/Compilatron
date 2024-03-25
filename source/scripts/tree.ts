class Tree extends Component {
    private root: TreeNode;
    private currNode: TreeNode;
    private currDepth: number;

    constructor(name: string) {
        super(name, false); //debugging has to manually set for tree as it's only useful for actual debugging
        this.root = null;
        this.currNode = null;
        this.currDepth = 0;
    }

    public addNode(label: string) {
        //console.log(this.currNode);
        var node = new TreeNode(label);
        if (this.root === null) {
            this.root = node;
            node.setParent(null);
            this.debug("Added root " + node.getName());
        }
        else {
            node.setParent(this.currNode);
            node.getParent().addChild(node);
            this.debug("Added branch " + node.getName());
        }
        this.currNode = node;
    }

    public addASTNode() {

    }

    //Since terminals are ALWAYS leaf nodes, we can
    //make a specialized function
    public addLeafNode(label: string, value: string) {
        // console.log(this.currNode);
        // console.log(this.currNode.getParent());
        var node = new TreeNode(label, value);
        this.debug("Added leaf " + node.getName());
        node.setParent(this.currNode);
        node.getParent().addChild(node);
    }

    public moveUp() {
        this.debug("Moved up.");
        this.currNode = this.currNode.getParent();
        console.log(this.currNode);
    }

    //performs a depth-first in-order traversal of the tree and prints it
    public printTree(node: TreeNode) {
        //console.log(node);
        if (node.getChildren().length === 0) {
            if (node.getValue()) {
                this.info(this.getDepthStr() + "<" + node.getName() + "[" + node.getValue() + "]>");
            } else {
                if (node.getName() !== "StatementList") {
                    if (node.getName() !== "CharList") {
                        //statementList and charList can have an epsilon transition,
                        //so they shouldn't be printed. This allows printing the AST
                        //to work without breaking printing the CST.
                        this.info(this.getDepthStr() + "[" + node.getName() + "]");
                    }
                }
            }
            this.currDepth -= 1;
            return;
        }

        this.info(this.getDepthStr() + "[" + node.getName() + "]");
        node.getChildren().forEach(e => {
            //console.log("here")
            //console.log(this.currDepth)
            this.currDepth++;
            //console.log("now:" +this.currDepth)
            this.printTree(e);
        });
        this.currDepth--;
        return;
    }

    //like print tree, but just grabs the good parts of the CST in order to build the AST
    public buildAST(node: TreeNode) {
        if (node.getChildren().length === 0) {
            if (["ID", "CHAR", "DIGIT", "I_TYPE", "S_TYPE", "B_TYPE", "SYM_IS_EQUAL", "SYM_IS_NOT_EQUAL", "SYM_ADD", "TRUE", "FALSE"].indexOf(node.getName()) > -1) {
                //this.addLeafNode(node.getName(), node.getValue());
                //this.moveUp();
                //this.currDepth--;
            }
            return;
        }

        

        for (var i = 0; i < node.getChildren().length; i++) {
            var child = node.getChildren()[i];
            
            switch (child.getName()) {
                case "Block": {
                    this.addNode(child.getName());
                    this.buildAST(child);
                    this.moveUp();
                    break;
                }
                case "PrintStatement": {
                    //this.addNode(child.getName());
                    break;
                }
                case "AssignmentStatement": {
                    //this.addNode(child.getName());
                    break;
                }
                case "IfStatement": {
                    //this.addNode(child.getName());
                    break;
                }
                case "WhileStatement": {
                    //this.addNode(child.getName());
                    break;
                }
                case "VarDecl": {
                    //this.addNode(child.getName());
                    var type;
                    var id;
                    this.analyzeVarDecl(type, id, child, new TreeNode(child.getName()));
                    break;
                }
                default: {
                    this.buildAST(child);
                }
            }


            
            
        }
        
        return;
    }

    private analyzeVarDecl(type: TreeNode, id: TreeNode, node: TreeNode, root: TreeNode) {
        console.log(type);
        console.log(id);
        console.log(node);
        if (node.getChildren().length === 0) {
            if (!type) {
                this.debug("found TYPE");
                type = node;
            }
            else if (!id) {
                this.debug("Found ID");
                id = node;
                
            }
            return {type: type, id: id};
        }

        

        node.getChildren().forEach(child => {
            var returnVal = this.analyzeVarDecl(type, id, child, root);
            if (returnVal.type) {
                console.log("type")
                type = returnVal.type;
            }
            
            if (returnVal.id) {
                console.log("id")
                id = returnVal.id;
            }
            
        });

        if (type && id) {
            this.debug("building subtree");
            console.log(this.currNode);
            
            var newNode = this.currNode.addChild(root);
            newNode.addChild(type);
            newNode.addChild(id);
            return;
        }
        
        return {type, id};
    }


    //print function that is specific to ASTs
    // public printAST(node: TreeNode) {
    //     if (node.getChildren().length === 0) {
    //         if (node.getValue()) {
    //             this.info(this.getDepthStr() + "<[" + node.getValue() + "]>");
    //         } else {
    //             if (node.getName() !== "StatementList") {
    //                 if (node.getName() !== "CharList") {
    //                     //statementList and charList can have an epsilon transition,
    //                     //so they shouldn't be printed. This allows printing the AST
    //                     //to work without breaking printing the CST.
    //                     this.info(this.getDepthStr() + "[" + node.getName() + "]");
    //                 }
    //             }
    //         }
    //         this.currDepth -= 1;
    //         return;
    //     }

    //     this.info(this.getDepthStr() + "[" + node.getName() + "]");
    //     node.getChildren().forEach(e => {
    //         //console.log("here")
    //         //console.log(this.currDepth)
    //         this.currDepth++;
    //         //console.log("now:" +this.currDepth)
    //         this.printAST(e);
    //     });
    //     this.currDepth--;
    //     return;
    // }


    //accessors
    public getRoot() {
        return this.root;
    }

    private getDepthStr() {
        var depthStr = "";
        for (var i = 0; i < this.currDepth; i++) {
            depthStr += "-";
        }
        return depthStr;
    }

}

class TreeNode {
    private name: string;
    private value: string;
    private parent: TreeNode;
    private children: Array<TreeNode>;

    constructor(newName: string, newValue?: string) {
        this.name = newName;
        this.value = newValue;
        this.children = new Array<TreeNode>;
    }
    

    public getName() {
        return this.name;
    }

    public getValue() {
        return this.value;
    }

    public getParent() {
        return this.parent;
    }

    public setParent(node: TreeNode) {
        this.parent = node;
    }

    public getChildren() {
        return this.children;
    }

    public addChild(node: TreeNode) {
        this.children.push(node);
        return node;
    }
}