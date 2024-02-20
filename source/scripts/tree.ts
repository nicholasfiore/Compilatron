class Tree extends Component {
    private root: TreeNode;
    private currNode: TreeNode;
    private currDepth: number;

    constructor(name: string) {
        super(name, false);
        this.root = null;
        this.currNode = null;
    }

    public addNode(label: string) {
        var node = new TreeNode(label);
        if (this.root === null) {
            this.root = node;
            node.setParent(null);
        }
        else {
            node.setParent(this.currNode);
            node.getParent().addChild(node);
        }
        this.currNode = node;
    }

    //Since terminals are ALWAYS leaf nodes, we can
    //make a specialized function
    public addLeafNode(label: string) {
        var node = new TreeNode(label);
        node.setParent(this.currNode);
        node.getParent().addChild(node);
    }

    public moveUp() {
        this.currNode = this.currNode.getParent();
    }

    //performs a depth-first in-order traversal of the tree and prints it
    public printTree(node: TreeNode) {
        if (node.getChildren().length === 0) {
            this.info("<" + node.getName() + ">");
            return;
        }
        
        node.getChildren().forEach(e => {
            this.printTree(e);
        });
    }

    public getRoot() {
        return this.root;
    }

}

class TreeNode {
    private name: string;
    private parent: TreeNode;
    private children: Array<TreeNode>;

    constructor(newName: string) {
        this.name = newName;
        this.children = new Array<TreeNode>;
    }

    public getName() {
        return this.name;
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
    }
}