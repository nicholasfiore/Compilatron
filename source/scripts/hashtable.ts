class HashTable extends Component {

}

class HashTree extends Component {
    private root: HashNode;
    private currNode: HashNode;

    constructor(name: string) {
        super(name, false);
        
    }

    public addNode(table: HashTable) {

    }

}

class HashNode {
    private table: HashTable;
    private parent: HashNode;
    private children: Array<HashNode>;

    constructor(newTable: HashTable) {
        this.table = newTable;
    }

    public getTable() {
        return this.table;
    }

    public getParent() {
        return this.parent;
    }

    public getChildren() {
        return this.children;
    }

    public addChild(child: HashNode) {
        this.children.push(child);
    }
}