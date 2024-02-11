

function initializeCompiler() {
    console.log("Initializing Compiler");
    var sourceCode: string = (<HTMLInputElement>document.getElementById("taSourceCode")).value;
    var _Compiler = new Compiler(sourceCode);
    _Compiler.compile();
}
