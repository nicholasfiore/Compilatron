class HashTable extends Component {
    private static readonly HASH_TABLE_SIZE = 26;

    private table: Array<HashEntry>;

    constructor(name: string) {
        super(name, false);
    }

    public makeHashCode(input: string) {
        var hash = input.charCodeAt(0) - 65 + "";
        return hash;
    }

    public put(key: string) {
        var hash = this.makeHashCode(key);
        var entry = new HashEntry(key);
        if (!this.table[hash]) {
            this.table[hash] = entry;
        } else {
            this.err("Redeclaration error");
        }
    }
}

class HashEntry {
    private hash;
    private id;
    private type;
    private isInit;
    private hasBeenUsed;

    constructor(id: string) {
        this.id = id;
    }

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