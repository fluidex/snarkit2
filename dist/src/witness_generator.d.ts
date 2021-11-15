declare function compileCircuitDir(circuitDirName: any, { forceRecompile, verbose, backend }: {
    forceRecompile: any;
    verbose: any;
    backend: any;
}): Promise<{
    circuitFilePath: string;
    r1csFilepath: string;
    symFilepath: string;
    binaryFilePath: string;
}>;
declare class WitnessGenerator {
    circuit: any;
    component: any;
    name: string;
    circuitDirName: string;
    binaryFilePath: string;
    forceRecompile: boolean;
    sanityCheck: boolean;
    verbose: boolean;
    writeExpectedOutput: boolean;
    backend: string;
    constructor(name: any, { backend, forceRecompile, verbose }?: {
        backend: string;
        forceRecompile: boolean;
        verbose: boolean;
    });
    chooseBackend(): Promise<"native" | "wasm">;
    compile(circuitDirName: any): Promise<{
        r1csFilepath: string;
        symFilepath: string;
    }>;
    generateWitness(inputFilePath: string, witnessFilePath: string): Promise<void>;
}
export { WitnessGenerator, compileCircuitDir };
