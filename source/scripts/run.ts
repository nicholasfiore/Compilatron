

function initializeCompiler() {
    console.log("Initializing Compiler");
    var sourceCode: string = (<HTMLInputElement>document.getElementById("taSourceCode")).value;
    let debug = document.getElementById("debugSwitch") as HTMLInputElement;
    var _Compiler = new Compiler(sourceCode, debug.checked)
    _Compiler.compile();
}
