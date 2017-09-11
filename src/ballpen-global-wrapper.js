// Ballpen wasm loader
import Wasm from './ballpen-wasm.js';

class BallpenGlobalWrapper {
    static set(Ballpen) {
        Ballpen.registerPlugin = BallpenGlobalWrapper.registerPlugin;


        // Global variables
        Ballpen.$refs = {};

        // Others
        if (window.WebAssembly && Ballpen.wasmPath) {
            Ballpen.wasmCore = {}; 
            Ballpen.wasmCore = Wasm.loadAll(Ballpen.wasmPath);
        }
    }

    static registerPlugin(alias, pluginEntity) {
        Ballpen[`$${alias}`] = pluginEntity;
    }
}

export default BallpenGlobalWrapper;
