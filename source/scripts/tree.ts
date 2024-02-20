class Tree {
    private root: TreeNode;
    private currNode: TreeNode;

    constructor() {
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

    public printTree() {
        
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

    public getParent() {
        return this.parent;
    }

    public setParent(node: TreeNode) {
        this.parent = node;
    }

    public addChild(node: TreeNode) {
        this.children.push(node);
    }
}