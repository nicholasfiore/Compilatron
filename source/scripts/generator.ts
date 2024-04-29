class Generator extends Component {
    private AST: Tree;
    private symbolTable: HashTree;

    private currProgram;
    
    private static readonly MAX_BYTES_MEMORY: number = 256;

    private currByte: number;
    private currTableEntry: number;
    private currJump: number;

    private lastCodeByte: number; //the last byte of code (the break)
    private lastStackByte: number; //the last byte used for stack memory

    private currHeapLoc: number = 255;

    private memory: string[];

    private currDepth: number = -1;
    private currScope: HashNode;
    private currScopeLabel: string;
    private repeatScope: string[] = new Array<string>;

    private errors = 0;

    private staticData: StaticEntry[];
    private jumps: JumpEntry[];
    private heapObjects: HeapEntry[];

    private validHex = new RegExp('[0-9A-F]')

    constructor(AST: Tree, symbolTable: HashTree, debug: boolean, program: number) {
        super("Code Generator", debug);
        this.AST = AST;
        //this.symbolTable = symbolTable;
        this.symbolTable = symbolTable;
        this.currProgram = program;

        this.currByte = 0;
        this.currTableEntry = -1;
        this.currJump = 0;

        this.currScope = symbolTable.getRoot();

        this.staticData = [];
        this.jumps = [];
        this.heapObjects = [];
        
        this.memory = Array(Generator.MAX_BYTES_MEMORY).fill("00");
    }

    public generate() {
        this.initializeCode(this.AST.getRoot());
        this.memory[this.currByte] = "00"; //ensures the last byte of code is a break
        this.lastCodeByte = this.currByte;

        if (this.currByte >= this.currHeapLoc || this.currByte > 255) {
            this.err("Cannot generate code: out of memory");
            this.errors++;
        } else {
            this.backPatch();
        }

        if (this.errors < 1) {
            //don't print the code
            this.printCode();
        }
    }

    private initializeCode(node:TreeNode) {
        
        if (this.currDepth < 0) {
            this.currDepth++;
            this.repeatScope[0] = "";
            this.currScopeLabel = "0 ";
            this.initializeCode(node);
        } else {
            node.getChildren().forEach(child => {
                let subChild1 = child.getChildren()[0];
                let subChild2 = child.getChildren()[1];
                switch(child.getName()) {
                    case "VarDecl": {
                        this.currTableEntry++;
                        let currEntry = this.currScope.getTable().get(subChild2.getValue());
                        let label = "T" + this.currTableEntry;
                        
                        let id = currEntry.getID();
                        let scope = currEntry.getScope();
                        let type = currEntry.getType();

                        this.staticData.push(new StaticEntry(label, id, scope, type))

                        // this.memory[this.currByte] = "A9";
                        // this.currByte++;
                        // this.memory[this.currByte] = "00";
                        // this.currByte++;
                        // this.memory[this.currByte] = "8D";
                        // this.currByte++;
                        // this.memory[this.currByte] = label;
                        // this.currByte++;
                        // this.memory[this.currByte] = "XX";
                        // this.currByte++;
                        break;
                    }
                    case "AssignmentStatement": {
                        //let currEntry = this.symbolTable.findID(subChild1.getValue(), this.currScope);
                        let tempStatic = this.findStaticEntry(subChild1.getValue(), this.symbolTable.findID(subChild1.getValue(), this.currScope).getScope());
                        let valNode = child.getChildren()[1];
                        let val;

                        if (valNode.getName() === "SYM_ADD") {
                            //result is stored in accumulator
                            this.addWithCarry(valNode);
                        } else if (valNode.getName() === "CharList") {
                            val = this.allocateHeap(child.getChildren()[1].getValue())
                            let address = this.toHexStr(val);

                            //load address as a constant
                            this.memory[this.currByte] = "A9";
                            this.currByte++;
                            this.memory[this.currByte] = address;
                            this.currByte++;
                        }
                        else if (valNode.getName() === "ID") {
                            val = this.findStaticEntry(subChild2.getValue(), this.symbolTable.findID(subChild2.getValue(), this.currScope).getScope())
                            let varAddress : StaticEntry = val;
                            
                            //load the value stored in the variable to the accumulator
                            this.memory[this.currByte] = "AD";
                            this.currByte++;
                            this.memory[this.currByte] = varAddress.getLabel();
                            this.currByte++;
                            this.memory[this.currByte] = "XX";
                            this.currByte++;

                        } else if (valNode.getName() == "SYM_IS_EQUAL" || valNode.getName() == "SYM_IS_NOT_EQUAL") {
                            //result is stored in ACC
                            this.expandBoolExpr(valNode);
                        }
                        
                        else {
                            let constant;
                            if (valNode.getName() === "DIGIT") {
                                val = parseInt(valNode.getValue());
                                constant = this.toHexStr(val);
                            } else {
                                if (valNode.getName() === "TRUE") {
                                    constant = this.toHexStr(1);
                                } else {
                                    constant = this.toHexStr(0);
                                }
                            }

                            //load constant
                            this.memory[this.currByte] = "A9";
                            this.currByte++;
                            this.memory[this.currByte] = constant;
                            this.currByte++;
                        }
                        //store to variable being assigned
                        this.memory[this.currByte] = "8D";
                        this.currByte++;
                        this.memory[this.currByte] = tempStatic.getLabel();
                        this.currByte++;
                        this.memory[this.currByte] = "XX";      
                        this.currByte++;
                        break;
                    }
                    case "PrintStatement": {
                        //let currEntry = this.symbolTable.getTable()[this.currTableEntry];

                        if (subChild1.getName() === "ID") {
                            let variable = this.findStaticEntry(subChild1.getValue(), this.symbolTable.findID(subChild1.getValue(), this.currScope).getScope())
                            let tempStatic = this.findStaticEntry(subChild1.getValue(), this.currScope.getTable().getName());

                            //all IDs must first load the value stored at their memory location into
                            //the Y register
                            this.memory[this.currByte] = "AC";
                            this.currByte++;
                            this.memory[this.currByte] = variable.getLabel();
                            this.currByte++;
                            this.memory[this.currByte] = "XX";
                            this.currByte++;

                            if (variable.getType() == "string") {
                                //strings print differently than digits or booleans
                                //and require a different system call    
                                this.memory[this.currByte] = "A2";
                                this.currByte++;
                                this.memory[this.currByte] = "02";
                                this.currByte++;
                                this.memory[this.currByte] = "FF";
                                this.currByte++;
                            } else {
                                this.memory[this.currByte] = "A2";
                                this.currByte++;
                                this.memory[this.currByte] = "01";
                                this.currByte++;
                                this.memory[this.currByte] = "FF";
                                this.currByte++;
                            }
                        } else if (subChild1.getName() === "CharList") {
                            //allocates the new string literal on the heap
                            let address = this.toHexStr(this.allocateHeap(subChild1.getValue()))

                            this.memory[this.currByte] = "A0";
                            this.currByte++;
                            this.memory[this.currByte] = address;
                            this.currByte++;
                            this.memory[this.currByte] = "A2";
                            this.currByte++;
                            this.memory[this.currByte] = "02";
                            this.currByte++;
                            this.memory[this.currByte] = "FF";
                            this.currByte++;
                        } else if (subChild1.getName() == "SYM_ADD") {
                            this.addWithCarry(subChild1);

                            //store ACC in 0xFF
                            this.memory[this.currByte] = "8D";
                            this.currByte++;
                            this.memory[this.currByte] = "FF";
                            this.currByte++;
                            this.memory[this.currByte] = "00";
                            this.currByte++;

                            //store 0xFF into the Y reg
                            this.memory[this.currByte] = "AC";
                            this.currByte++;
                            this.memory[this.currByte] = "FF";
                            this.currByte++;
                            this.memory[this.currByte] = "00";
                            this.currByte++;
                            
                            //print value in Y reg
                            this.memory[this.currByte] = "A2";
                            this.currByte++;
                            this.memory[this.currByte] = "01";
                            this.currByte++;
                            this.memory[this.currByte] = "FF";
                            this.currByte++;
                        } else if (subChild1.getName() == "SYM_IS_EQUAL" || subChild1.getName() == "SYM_IS_NOT_EQUAL") {
                            this.expandBoolExpr(subChild1);
                            
                            //store ACC in 0xFF
                            this.memory[this.currByte] = "8D";
                            this.currByte++;
                            this.memory[this.currByte] = "FF";
                            this.currByte++;
                            this.memory[this.currByte] = "00";
                            this.currByte++;

                            //store 0xFF into the Y reg
                            this.memory[this.currByte] = "AC";
                            this.currByte++;
                            this.memory[this.currByte] = "FF";
                            this.currByte++;
                            this.memory[this.currByte] = "00";
                            this.currByte++;
                            
                            //print value in Y reg
                            this.memory[this.currByte] = "A2";
                            this.currByte++;
                            this.memory[this.currByte] = "01";
                            this.currByte++;
                            this.memory[this.currByte] = "FF";
                            this.currByte++;
                        } else {
                            let value;
                            if (subChild1.getName() === "DIGIT") {
                                value = this.toHexStr(subChild1.getValue())
                                //code for digits
                                this.memory[this.currByte] = "A0";
                                this.currByte++;
                                this.memory[this.currByte] = value;
                                this.currByte++;
                            } else {
                                if (subChild1.getName() === "TRUE") {
                                    this.memory[this.currByte] = "A0";
                                    this.currByte++;
                                    this.memory[this.currByte] = "01";
                                    this.currByte++;
                                } else {
                                    this.memory[this.currByte] = "A0";
                                    this.currByte++;
                                    this.memory[this.currByte] = "00";
                                    this.currByte++;
                                }
                            }
                            //print value in y reg
                            this.memory[this.currByte] = "A2";
                            this.currByte++;
                            this.memory[this.currByte] = "01";
                            this.currByte++;
                            this.memory[this.currByte] = "FF";
                            this.currByte++;
                            
                        //} else if (subChild1.getName() === "ID") {
                        } 

                        
                        break;
                    }
                    case "IfStatement": {

                        if (subChild1.getName() === "TRUE") {
                            this.memory[this.currByte] = "A9";
                            this.currByte++;
                            this.memory[this.currByte] = "01";
                            this.currByte++;
                        } else if (subChild1.getName() === "FALSE") {
                            this.memory[this.currByte] = "A9";
                            this.currByte++;
                            this.memory[this.currByte] = "00";
                            this.currByte++;
                        } else {
                            //evaluate the boolean expression, stored in the ACC
                            this.expandBoolExpr(subChild1);
                        }

                        //store ACC result in 0xFF
                        this.memory[this.currByte] = "8D";
                        this.currByte++;
                        this.memory[this.currByte] = "FF";
                        this.currByte++;
                        this.memory[this.currByte] = "00";
                        this.currByte++;

                        //add 0x01 to the X reg
                        this.memory[this.currByte] = "A2";
                        this.currByte++;
                        this.memory[this.currByte] = "01";
                        this.currByte++;

                        //compare to value in 0xFF
                        this.memory[this.currByte] = "EC";
                        this.currByte++;
                        this.memory[this.currByte] = "FF";
                        this.currByte++;
                        this.memory[this.currByte] = "00";
                        this.currByte++;

                        //add temporary jump label
                        this.jumps.push(new JumpEntry("J" + this.currJump));
                        let jumpEntry = this.findJump("J" + this.currJump);

                        //place BNE and jump label
                        this.memory[this.currByte] = "D0";
                        this.currByte++;
                        this.memory[this.currByte] = jumpEntry.getLabel();
                        this.currByte++;
                        
                        //mark the current byte and enter a new block
                        let startByte = this.currByte;
                        this.currDepth++;
                        this.currScopeLabel = this.labelScope(this.currDepth);
                        this.currScope = this.symbolTable.findScope(this.currScopeLabel, this.currScope);
                        this.initializeCode(subChild2);

                        //once breaking the recursion, use the current byte subtracted from the start byte as the jump distance
                        let distance = this.currByte - startByte;

                        //set the correct label with the new distance
                        jumpEntry.setDistance(distance);

                        this.currJump++;
                        break;
                    }
                    case "WhileStatement": {
                        //mark start byte. It needs to happen before the condition since while
                        //will loop back and check the condition each iteration
                        let startByte = this.currByte;

                        if (subChild1.getName() === "TRUE") {
                            this.memory[this.currByte] = "A9";
                            this.currByte++;
                            this.memory[this.currByte] = "01";
                            this.currByte++;
                        } else if (subChild1.getName() === "FALSE") {
                            this.memory[this.currByte] = "A9";
                            this.currByte++;
                            this.memory[this.currByte] = "00";
                            this.currByte++;
                        } else {
                            //evaluate the boolean expression, store in the ACC
                            this.expandBoolExpr(subChild1);
                        }

                        //store ACC result in 0xFF
                        this.memory[this.currByte] = "8D";
                        this.currByte++;
                        this.memory[this.currByte] = "FF";
                        this.currByte++;
                        this.memory[this.currByte] = "00";
                        this.currByte++;

                        //add 0x01 to the X reg
                        this.memory[this.currByte] = "A2";
                        this.currByte++;
                        this.memory[this.currByte] = "01";
                        this.currByte++;

                        //compare to value in 0xFF
                        this.memory[this.currByte] = "EC";
                        this.currByte++;
                        this.memory[this.currByte] = "FF";
                        this.currByte++;
                        this.memory[this.currByte] = "00";
                        this.currByte++;

                        //add temporary jump label
                        this.jumps.push(new JumpEntry("J" + this.currJump));
                        let jumpEntry1 = this.findJump("J" + this.currJump);
                        this.currJump++;

                        //place BNE and jump label, marking the byte that the branch occurs on
                        this.memory[this.currByte] = "D0";
                        this.currByte++;
                        this.memory[this.currByte] = jumpEntry1.getLabel();
                        this.currByte++;
                        let branchByte = this.currByte;

                        //enter block
                        this.currDepth++;
                        this.currScopeLabel = this.labelScope(this.currDepth);
                        this.currScope = this.symbolTable.findScope(this.currScopeLabel, this.currScope);
                        this.initializeCode(subChild2);

                        //add another temporary jump label
                        this.jumps.push(new JumpEntry("J" + this.currJump));
                        let jumpEntry2 = this.findJump("J" + this.currJump);
                        this.currJump++;

                        /* unconditional branch back to top of loop */
                        this.memory[this.currByte] = "A9";
                        this.currByte++;
                        this.memory[this.currByte] = "00";
                        this.currByte++;

                        this.memory[this.currByte] = "8D";
                        this.currByte++;
                        this.memory[this.currByte] = "FF";
                        this.currByte++;
                        this.memory[this.currByte] = "00";
                        this.currByte++;

                        this.memory[this.currByte] = "A2";
                        this.currByte++;
                        this.memory[this.currByte] = "01";
                        this.currByte++;

                        this.memory[this.currByte] = "EC";
                        this.currByte++;
                        this.memory[this.currByte] = "FF";
                        this.currByte++;
                        this.memory[this.currByte] = "00";
                        this.currByte++;

                        this.memory[this.currByte] = "D0";
                        this.currByte++;
                        this.memory[this.currByte] = jumpEntry2.getLabel();
                        this.currByte++;

                        let endBlock = this.currByte;
                        let dist1 = endBlock - branchByte;
                        jumpEntry1.setDistance(dist1);

                        let returnToCondition = this.currByte;

                        //set distance using the branch byte and the start byte
                        let dist2 = startByte + 256;
                        dist2 = dist2 - returnToCondition;

                        //set the correct label with the new distance
                        jumpEntry2.setDistance(dist2);

                        break;
                    }
                    case "Block": {
                        this.currDepth++;
                        this.currScopeLabel = this.labelScope(this.currDepth);
                        this.currScope = this.symbolTable.findScope(this.currScopeLabel, this.currScope)
                        this.initializeCode(child);
                        break;
                    }
                }
            });
            this.currDepth--;
            this.currScope = this.currScope.getParent();
            if (this.currScope) {
                this.currScopeLabel = this.currScope.getTable().getName();
            }
        }
    }

    private labelScope(depth:number) {
        let currSubLabel;
        if (depth == 0) {
            currSubLabel = " ";
        }
        else if (this.repeatScope.length-1 < depth) {
            this.repeatScope.push("a");
            currSubLabel = this.repeatScope[depth];
        } else {
            currSubLabel = this.repeatScope[depth];
            let temp = currSubLabel.charCodeAt(0);
            currSubLabel = String.fromCharCode(temp + 1);
            this.repeatScope[depth] = currSubLabel;
        }
        return depth + currSubLabel;
    }

    private expandBoolExpr(node: TreeNode) {
        var child1 = node.getChildren()[0];
        var child2 = node.getChildren()[1];

        if (node.getName() == "SYM_IS_EQUAL") {
            //can be stored directly into the X reg
            if (child1.getName() == "ID") {
                let addr = this.findStaticEntry(child1.getValue(), this.symbolTable.findID(child1.getValue(), this.currScope).getScope())
                this.memory[this.currByte] = "AE";
                this.currByte++;
                this.memory[this.currByte] = addr.getLabel();
                this.currByte++;
                this.memory[this.currByte] = "XX";
                this.currByte++;
            } else if (child1.getName() == "DIGIT") {
                let constant = this.toHexStr(child1.getValue());
                this.memory[this.currByte] = "A2";
                this.currByte++;
                this.memory[this.currByte] = constant;
                this.currByte++;
            } else if (child1.getName() === "TRUE" || child1.getName() === "FALSE") {
                if (child1.getName() == "TRUE") {
                    this.memory[this.currByte] = "A2";
                    this.currByte++;
                    this.memory[this.currByte] = "01"; //0x01 represents true
                    this.currByte++;
                } else {
                    this.memory[this.currByte] = "A2";
                    this.currByte++;
                    this.memory[this.currByte] = "00"; //0x00 represents false
                    this.currByte++;
                }
            } else if (child1.getName() === "CharList") {
                let addr = this.allocateHeap(child1.getValue());
                this.memory[this.currByte] = "A2";
                this.currByte++;
                this.memory[this.currByte] = this.toHexStr(addr);
                this.currByte++;
            } else {
                //anything else must be store in the ACC first and then into a temporary address
                //before finally into the X reg
                if (child1.getName() === "SYM_ADD") {
                    this.addWithCarry(child1);
                } else {
                    this.expandBoolExpr(child1);
                }
                this.memory[this.currByte] = "8D";
                this.currByte++;
                this.memory[this.currByte] = "FF";
                this.currByte++;
                this.memory[this.currByte] = "00";
                this.currByte++;
                this.memory[this.currByte] = "AE";
                this.currByte++;
                this.memory[this.currByte] = "FF";
                this.currByte++;
                this.memory[this.currByte] = "00";
                this.currByte++;
            }
            
            if (child2.getName() == "ID") {
                //if its an ID, comparison can happen directly to X reg
                let addr = this.findStaticEntry(child2.getValue(), this.symbolTable.findID(child2.getValue(), this.currScope).getScope())
                this.memory[this.currByte] = "EC";
                this.currByte++;
                this.memory[this.currByte] = addr.getLabel();
                this.currByte++;
                this.memory[this.currByte] = "XX";
                this.currByte++;
            } else {
                //otherwise, temporary storage is required
                if (child2.getName() == "DIGIT") {
                    let constant = this.toHexStr(child2.getValue());
                    this.memory[this.currByte] = "A9";
                    this.currByte++;
                    this.memory[this.currByte] = constant;
                    this.currByte++;
                }
                else if (child2.getName() == "SYM_ADD") {
                    this.addWithCarry(child2);
                } else if (child2.getName() === "CharList") {
                    let addr = this.allocateHeap(child2.getValue());
                    this.memory[this.currByte] = "A9";
                    this.currByte++;
                    this.memory[this.currByte] = this.toHexStr(addr);
                    this.currByte++;
                } else {
                    this.memory[this.currByte] = "A9";
                    this.currByte++;
                    if (child2.getName() == "TRUE") {
                        this.memory[this.currByte] = "01"; //0x01 represents true
                        this.currByte++;
                    } else if (child2.getName() == "FALSE") {
                        this.memory[this.currByte] = "00"; //0x00 represents false
                        this.currByte++;
                    } else {
                        this.expandBoolExpr(child1);
                    }
                }
                //store in 0xFF
                this.memory[this.currByte] = "8D";
                this.currByte++;
                this.memory[this.currByte] = "FF";
                this.currByte++;
                this.memory[this.currByte] = "00";
                this.currByte++;

                //compare X reg to 0xFF
                this.memory[this.currByte] = "EC";
                this.currByte++;
                this.memory[this.currByte] = "FF";
                this.currByte++;
                this.memory[this.currByte] = "00";
                this.currByte++;
            }
            //branch on not equal
            this.memory[this.currByte] = "D0";
            this.currByte++;
            this.memory[this.currByte] = "0C";
            this.currByte++;

            //if z-flag = 1, add 0x01 to the ACC and temporarily store in 0xFF
            this.memory[this.currByte] = "A9";
            this.currByte++;
            this.memory[this.currByte] = "01";
            this.currByte++;
            this.memory[this.currByte] = "8D";
            this.currByte++;
            this.memory[this.currByte] = "FF";
            this.currByte++;
            this.memory[this.currByte] = "00";
            this.currByte++;
            //put 0x00 in the X reg and compare
            this.memory[this.currByte] = "A2";
            this.currByte++;
            this.memory[this.currByte] = "00";
            this.currByte++;
            this.memory[this.currByte] = "EC";
            this.currByte++;
            this.memory[this.currByte] = "FF";
            this.currByte++;
            this.memory[this.currByte] = "00";
            this.currByte++;
            //branch past not-equal logic
            this.memory[this.currByte] = "D0";
            this.currByte++;
            this.memory[this.currByte] = "05";
            this.currByte++;

            //if z-flag = 0, add 0x00 to the ACC and temporarily store it in 0xFF
            this.memory[this.currByte] = "A9";
            this.currByte++;
            this.memory[this.currByte] = "00";
            this.currByte++;
            this.memory[this.currByte] = "8D";
            this.currByte++;
            this.memory[this.currByte] = "FF";
            this.currByte++;
            this.memory[this.currByte] = "00";
            this.currByte++;

            //after value is stored, return it to the ACC
            this.memory[this.currByte] = "AD";
            this.currByte++;
            this.memory[this.currByte] = "FF";
            this.currByte++;
            this.memory[this.currByte] = "00";
            this.currByte++;
        } else {
            //not-equal logic
            //can be stored directly into the X reg
            if (child1.getName() == "ID") {
                let addr = this.findStaticEntry(child1.getValue(), this.symbolTable.findID(child1.getValue(), this.currScope).getScope())
                this.memory[this.currByte] = "AE";
                this.currByte++;
                this.memory[this.currByte] = addr.getLabel();
                this.currByte++;
                this.memory[this.currByte] = "XX";
                this.currByte++;
            } else if (child1.getName() == "DIGIT") {
                let constant = this.toHexStr(child1.getValue());
                this.memory[this.currByte] = "A2";
                this.currByte++;
                this.memory[this.currByte] = constant;
                this.currByte++;
            } else if (child1.getName() === "TRUE" || child1.getName() === "FALSE") {
                if (child1.getName() == "TRUE") {
                    this.memory[this.currByte] = "A2";
                    this.currByte++;
                    this.memory[this.currByte] = "01"; //0x01 represents true
                    this.currByte++;
                } else {
                    this.memory[this.currByte] = "A2";
                    this.currByte++;
                    this.memory[this.currByte] = "00"; //0x00 represents false
                    this.currByte++;
                }
            } else if (child1.getName() === "CharList") {
                let addr = this.allocateHeap(child1.getValue());
                this.memory[this.currByte] = "A2";
                this.currByte++;
                this.memory[this.currByte] = this.toHexStr(addr);
                this.currByte++;
            } else {
                //anything else must be store in the ACC first and then into a temporary address
                //before finally into the X reg
                if (child1.getName() === "SYM_ADD") {
                    this.addWithCarry(child1);
                } else {
                    this.expandBoolExpr(child1);
                }
                this.memory[this.currByte] = "8D";
                this.currByte++;
                this.memory[this.currByte] = "FF";
                this.currByte++;
                this.memory[this.currByte] = "00";
                this.currByte++;
                this.memory[this.currByte] = "AE";
                this.currByte++;
                this.memory[this.currByte] = "FF";
                this.currByte++;
                this.memory[this.currByte] = "00";
                this.currByte++;
            }
            
            if (child2.getName() == "ID") {
                //if its an ID, comparison can happen directly to X reg
                let addr = this.findStaticEntry(child2.getValue(), this.symbolTable.findID(child2.getValue(), this.currScope).getScope())
                this.memory[this.currByte] = "EC";
                this.currByte++;
                this.memory[this.currByte] = addr.getLabel();
                this.currByte++;
                this.memory[this.currByte] = "XX";
                this.currByte++;
            } else {
                //otherwise, temporary storage is required
                if (child2.getName() == "DIGIT") {
                    let constant = this.toHexStr(child2.getValue());
                    this.memory[this.currByte] = "A9";
                    this.currByte++;
                    this.memory[this.currByte] = constant;
                    this.currByte++;
                }
                else if (child2.getName() == "SYM_ADD") {
                    this.addWithCarry(child2);
                } else if (child2.getName() === "CharList") {
                    let addr = this.allocateHeap(child2.getValue());
                    this.memory[this.currByte] = "A9";
                    this.currByte++;
                    this.memory[this.currByte] = this.toHexStr(addr);
                    this.currByte++;
                } else {
                    this.memory[this.currByte] = "A9";
                    this.currByte++;
                    if (child2.getName() == "TRUE") {
                        this.memory[this.currByte] = "01"; //0x01 represents true
                        this.currByte++;
                    } else if (child2.getName() == "FALSE") {
                        this.memory[this.currByte] = "00"; //0x00 represents false
                        this.currByte++;
                    } else {
                        this.expandBoolExpr(child1);
                    }
                }
                //store in 0xFF
                this.memory[this.currByte] = "8D";
                this.currByte++;
                this.memory[this.currByte] = "FF";
                this.currByte++;
                this.memory[this.currByte] = "00";
                this.currByte++;

                //compare X reg to 0xFF
                this.memory[this.currByte] = "EC";
                this.currByte++;
                this.memory[this.currByte] = "FF";
                this.currByte++;
                this.memory[this.currByte] = "00";
                this.currByte++;
            }
            //branch on not equal
            this.memory[this.currByte] = "D0";
            this.currByte++;
            this.memory[this.currByte] = "0C";
            this.currByte++;

            //if z-flag = 1, add 0x00 to the ACC and temporarily store in 0xFF
            this.memory[this.currByte] = "A9";
            this.currByte++;
            this.memory[this.currByte] = "00";
            this.currByte++;
            this.memory[this.currByte] = "8D";
            this.currByte++;
            this.memory[this.currByte] = "FF";
            this.currByte++;
            this.memory[this.currByte] = "00";
            this.currByte++;
            //put 0x01 in the X reg and compare
            this.memory[this.currByte] = "A2";
            this.currByte++;
            this.memory[this.currByte] = "01";
            this.currByte++;
            this.memory[this.currByte] = "EC";
            this.currByte++;
            this.memory[this.currByte] = "FF";
            this.currByte++;
            this.memory[this.currByte] = "00";
            this.currByte++;
            //branch past not-equal logic
            this.memory[this.currByte] = "D0";
            this.currByte++;
            this.memory[this.currByte] = "05";
            this.currByte++;

            //if z-flag = 0, add 0x01 to the ACC and temporarily store it in 0xFF
            this.memory[this.currByte] = "A9";
            this.currByte++;
            this.memory[this.currByte] = "01";
            this.currByte++;
            this.memory[this.currByte] = "8D";
            this.currByte++;
            this.memory[this.currByte] = "FF";
            this.currByte++;
            this.memory[this.currByte] = "00";
            this.currByte++;

            //after value is stored, return it to the ACC
            this.memory[this.currByte] = "AD";
            this.currByte++;
            this.memory[this.currByte] = "FF";
            this.currByte++;
            this.memory[this.currByte] = "00";
            this.currByte++;
        }
    }

    private addWithCarry(node: TreeNode) {
        let child1 = node.getChildren()[0];
        let child2 = node.getChildren()[1];

        if (child2.getName() == "SYM_ADD") {
            this.addWithCarry(child2);
            //stores the result into 0xFF
            this.memory[this.currByte] = "8D";
            this.currByte++;
            this.memory[this.currByte] = "FF";
            this.currByte++;
            this.memory[this.currByte] = "00";
            this.currByte++;

            //load child 1 now
            this.memory[this.currByte] = "A9";
            this.currByte++;
            this.memory[this.currByte] = this.toHexStr(child1.getValue());
            this.currByte++;
            // this.memory[this.currByte] = "6D";
            // this.currByte++;
            // this.memory[this.currByte] = "FF";
            // this.currByte++;
            // this.memory[this.currByte] = "00";
            // this.currByte++;
        } else if (child2.getName() == "ID") {
            let val = this.toHexStr(child1.getValue());
            let tempStatic = this.findStaticEntry(child2.getValue(), this.symbolTable.findID(child2.getValue(), this.currScope).getScope())

            this.memory[this.currByte] = "A9";
            this.currByte++;
            this.memory[this.currByte] = val;
            this.currByte++;
            this.memory[this.currByte] = "8D";
            this.currByte++;
            this.memory[this.currByte] = "FF";
            this.currByte++;
            this.memory[this.currByte] = "00";
            this.currByte++;

            //load the value stored in the variable to the accumulator
            this.memory[this.currByte] = "AD";
            this.currByte++;
            this.memory[this.currByte] = tempStatic.getLabel();
            this.currByte++;
            this.memory[this.currByte] = "XX";
            this.currByte++;
        } else {
            //has to be a digit if it's not the other two
            //load first value into ACC, then store it at 0xFF
            let val1 = this.toHexStr(child1.getValue());
            let val2 = this.toHexStr(child2.getValue());

            this.memory[this.currByte] = "A9";
            this.currByte++;
            this.memory[this.currByte] = val1;
            this.currByte++;
            this.memory[this.currByte] = "8D";
            this.currByte++;
            this.memory[this.currByte] = "FF";
            this.currByte++;
            this.memory[this.currByte] = "00";
            this.currByte++;
            this.memory[this.currByte] = "A9";
            this.currByte++;
            this.memory[this.currByte] = val2;
            this.currByte++;
        }

        //add from address 0xFF
        this.memory[this.currByte] = "6D";
        this.currByte++;
        this.memory[this.currByte] = "FF";
        this.currByte++;
        this.memory[this.currByte] = "00";
        this.currByte++;
    }

    // public findID(id: string, scope: string, currScope: HashNode) {
    //     let thisScope 
    // }

    private allocateStack() {

    }

    //allocates a string into heap memory
    //if there is an error, returns -1. Otherwise, returns the memory location of the first character
    private allocateHeap(charlist: string) {
        let entry: HeapEntry;
        for (let i = 0; i < this.heapObjects.length; i++) {
            if (this.heapObjects[i].getValue() == charlist) {
                entry = this.heapObjects[i];
            }
        }

        if (entry) {
            //an identical string exists in the heap, so assign the same pointer
            return entry.getStartLocation();
        } else {
            //if the string doesn't already exist in the heap, add it
            this.currHeapLoc = this.currHeapLoc - (charlist.length + 1);

            this.heapObjects.push(new HeapEntry(this.currHeapLoc, charlist))

            if (this.currHeapLoc <= this.lastStackByte) {
                this.err("Cannot generate code: out of memory (heap)");
                this.errors++;
                return -1;
            } else {
                let i;
                for (i = 0; i < charlist.length; i++) {
                    this.memory[this.currHeapLoc + i] = charlist.charCodeAt(i).toString(16).toUpperCase();
                }
                this.memory[this.currHeapLoc + i] = "00";
                return this.currHeapLoc;
            }
        }
    }

    private backPatch() {
        let stackByte = this.lastCodeByte + 1;
        //replace static data labels
        this.staticData.forEach(entry => {
            for (let i = 0; i < this.memory.length; i++) {
                if (entry.getLabel() === this.memory[i]) {
                    this.memory[i] = this.toHexStr(stackByte);
                    this.memory[i + 1] = "00";//little endian with 256 available bytes means this is always 00
                    i++; //since we're also replacing the next byte, increment i an additional time
                }
            }
            stackByte++;
        });

        if (stackByte >= this.currHeapLoc || stackByte > 255) {
            this.err("Cannot generate code: out of memory (stack)");
            this.errors++;
        }

        //replace jump labels
        this.jumps.forEach(entry => {
            for (let i = 0; i < this.memory.length; i++) {
                if (entry.getLabel() === this.memory[i]) {
                    this.memory[i] = this.toHexStr(entry.getDistance());
                }
            }
        });

        this.lastStackByte = stackByte;
    }

    private printCode() {
        let currProg = document.getElementById(`program${this.currProgram}`);
        let code = currProg.querySelector('#code');
        let textarea = code.querySelector('textarea');
        textarea.value = this.memory.join(" ");
        console.log(textarea.value);
    }

    private findStaticEntry(id:string, scope:string) {
        for (var i = 0; i < this.staticData.length; i++) {
            let entry = this.staticData[i];
            if (entry.getID() === id && entry.getScope() === scope) {
                return entry;
            }
        }
        return null;
    }

    private findJump(label:string) {
        for (let i = 0; i < this.jumps.length; i++) {
            if (this.jumps[i].getLabel() === label) {
                return this.jumps[i];
            }
        }
        return null;
    }

    //ensures the code are all hex codes before sending it to be printed. Useful for bugtesting.
    private checkHexValidity(arr:string[]) {
        let invalidFlag = false;
        arr.forEach(byte => {
            if (!this.validHex.test(byte)) {
                invalidFlag = true;
            }
        });
        return !invalidFlag; //return true if the hex is valid, false if it invalid
    }
}

class StaticEntry {
    private label: string;
    private type: string;
    private id: string;
    private scope: string;

    constructor(label:string, id:string, scope:string, type:string) {
        this.label = label;
        this.id = id;
        this.scope = scope;
        this.type = type;
    }

    public getID() {
        return this.id;
    }
    
    public getScope() {
        return this.scope;
    }

    public getLabel() {
        return this.label;
    }

    public getType() {
        return this.type;
    }
}

class JumpEntry {
    private label: string;
    private distance: number;

    constructor(lab: string) {
        this.label = lab;
    }

    public getLabel() {
        return this.label;
    }

    public getDistance() {
        return this.distance;
    }

    public setDistance(dist:number) {
        this.distance = dist;
    }
}

class HeapEntry {
    private startLoc: number;
    private value: string;

    constructor(start: number, val: string) {
        this.startLoc = start;
        this.value = val;
    }

    getStartLocation() {
        return this.startLoc;
    }

    getValue() {
        return this.value;
    }
}