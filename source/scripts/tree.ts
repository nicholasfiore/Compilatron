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

    //Since terminals are ALWAYS leaf nodes, we can
    //make a specialized function
    public addLeafNode(label: string, value: string, line: number, pos: number) {
        // console.log(this.currNode);
        // console.log(this.currNode.getParent());
        var node = new TreeNode(label, line, value);
        node.setPos(pos);
        this.debug("Added leaf " + node.getName());
        node.setParent(this.currNode);
        node.getParent().addChild(node);
    }

    public moveUp() {
        this.debug("Moved up.");
        this.currNode = this.currNode.getParent();
        //console.log(this.currNode);
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
                    this.interpretBlock(child);
                    break;
                }
                case "PrintStatement": {
                    this.interpretPrintStatement(child);
                    break;
                }
                case "AssignmentStatement": {
                    //this.addNode(child.getName());
                    this.interpretAssignmentStatement(child);
                    break;
                }
                case "IfStatement": {
                    //this.addNode(child.getName());
                    this.interpretIfOrWhile(child);
                    break;
                }
                case "WhileStatement": {
                    //this.addNode(child.getName());
                    this.interpretIfOrWhile(child);
                    break;
                }
                case "VarDecl": {
                    //this.addNode(child.getName());
                    var type;
                    var id;
                    this.interpretVarDecl(type, id, child, new TreeNode(child.getName(), child.getLine()));
                    break;
                }
                default: {
                    this.buildAST(child);
                }
            }
        }
        
        return;
    }

    //recursively condenses a char list into a single string for printing
    private condenseString(node: TreeNode, queue: Array<string>) {
        if (node.getChildren().length === 0) {
            //console.log(node.getValue())
            queue.push(node.getValue())
            return;
        }

        node.getChildren().forEach(child => {
            this.condenseString(child, queue);
        });
        return;
    }

    private interpretBlock(node: TreeNode) {
        //console.log(this.currNode);
        this.addNode(node.getName());
        this.buildAST(node);
        this.moveUp();
    }

    private interpretExpr(node: TreeNode) {
        var retVal;
        var child = node.getChildren()[0];
        switch (child.getName()) {
            case "StringExpr": {
                retVal = this.interpretStrExpr(child);
                break;
            }
            case "IntExpr": {
                retVal = this.interpretIntExpr(child);
                break;
            }
            case "BooleanExpr": {
                retVal = this.interpretBooleanExpr(child);
                break;
            }
            case "ID": {
                retVal = new TreeNode(child.getName(), child.getLine(), child.getValue());
                break;
            }
            default: { console.log("default") }//throw it out, we only care about expressions
        }
        return retVal;
    }

    private interpretStrExpr(node: TreeNode) {
        var queue = [];
        this.condenseString(node.getChildren()[1], queue);
        var str = queue.join("");
        var retVal = new TreeNode(str, node.getLine());

        return retVal;
    }

    private interpretIntExpr(node: TreeNode) {
        var digit;
        var op;
        var expr;
        if (node.getChildren().length === 1) {
            digit = node.getChildren()[0];
            return new TreeNode(digit.getName(), digit.getLine(), digit.getValue());
        }
        else {
            digit = node.getChildren()[0];
            op = node.getChildren()[1];
            expr = this.interpretExpr(node.getChildren()[2]);
        }
        var opNode = new TreeNode(op.getName(), op.getValue());
        opNode.addChild(new TreeNode(digit.getName(), digit.getLine(), digit.getValue()));
        opNode.addChild(expr);
        return opNode;
    }

    private interpretBooleanExpr(node: TreeNode) {
        var boolOp;
        var expr1;
        var expr2;
        var children = node.getChildren();
        if (children[0].getName() === "SYM_L_PAREN") {
            expr1 = this.interpretExpr(children[1]);
            boolOp = children[2].getChildren()[0];
            expr2 = this.interpretExpr(children[3]);
            
            var retVal = new TreeNode(boolOp.getName(), boolOp.getValue());
            retVal.addChild(expr1);
            retVal.addChild(expr2);
            return retVal;
        } else {
            var boolval = new TreeNode(children[0].getName(), children[0].getLine(), children[0].getValue());
            console.log("here");
            return boolval;
        }
    }

    //print statement
    private interpretPrintStatement(node: TreeNode) {
        if (node.getChildren().length === 0) {
            return;
        }

        node.getChildren().forEach(child => {
            if (child.getName() === "Expr") {
                var val = this.interpretExpr(child);
                var nextNode = this.currNode.addChild(new TreeNode("PrintStatement"));
                nextNode.addChild(val);
            } 
        });
        return;
    }

    //
    private interpretIfOrWhile(node: TreeNode) {
        this.addNode(node.getName());
        var boolExpr = this.interpretBooleanExpr(node.getChildren()[1]);
        this.currNode.addChild(boolExpr);
        this.interpretBlock(node.getChildren()[2]);
        this.moveUp();
        return;
    }

    private interpretVarDecl(type: TreeNode, id: TreeNode, node: TreeNode, root: TreeNode) {
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
            var returnVal = this.interpretVarDecl(type, id, child, root);
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

    // private interpretAssignmentStatement(id: TreeNode, expr: TreeNode, node: TreeNode, root: TreeNode) {
    //     if (node.getChildren().length === 0) {
    //         if (!id) {
    //             this.debug("found ID");
    //             id = node;
    //         }
    //         else if (!expr) {
    //             this.debug("Found EXPR");
    //             expr = node;
                
    //         }
    //         return {id: id, expr: expr};
    //     }

        

    //     node.getChildren().forEach(child => {
    //         var returnVal = this.interpretAssignmentStatement(expr, id, child, root);
    //         if (returnVal.expr) {
    //             id = returnVal.id;
    //         }
            
    //         if (returnVal.id) {
    //             console.log("id")
    //             expr = returnVal.expr;
    //         }
            
    //     });

    //     if (expr && id) {
    //         this.debug("building subtree");
    //         console.log(this.currNode);
            
    //         var newNode = this.currNode.addChild(root);
    //         newNode.addChild(id);
    //         newNode.addChild(expr);
    //         return;
    //     }
        
    //     return {id, expr};
    // }

    private interpretAssignmentStatement(node: TreeNode) {
        var id;
        var expr;
        var children = node.getChildren();
        id = children[0];
        expr = this.interpretExpr(children[2]);
        var newNode;
        newNode = new TreeNode(node.getName(), node.getLine());
        newNode.addChild(id);
        newNode.addChild(expr);
        this.currNode.addChild(newNode);
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

    private line: number;
    private pos: number;

    constructor(newName: string, line?: number, newValue?: string) {
        this.name = newName;
        this.value = newValue;
        this.line = line;
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

    public getLine() {
        return this.line;
    }

    public getPos() {
        return this.pos;
    }

    public setParent(node: TreeNode) {
        this.parent = node;
    }

    public getChildren() {
        return this.children;
    }

    public setLine(line) {
        this.line = line;
    }

    public setPos(pos) {
        this.pos = pos;
    }

    public addChild(node: TreeNode) {
        this.children.push(node);
        return node;
    }
}