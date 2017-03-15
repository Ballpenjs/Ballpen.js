import Axios from 'axios';
import Underscore from 'underscore';
import Velocity from 'velocity-animate';

// Ballpen build-in plugins
import Cookie from 'ballpen-plugin-cookie';
import Cache from 'ballpen-plugin-cache';

// Ballpen wasm loader
import WasmLoader from './ballpen-wasm-loader.js';
import WasmBytes from './ballpen-wasm-bytes.js';

class BallpenGlobalWrapper {
    static set(Ballpen) {
        Ballpen.registerPlugin = BallpenGlobalWrapper.registerPlugin;

        // Bind plugins
        Ballpen.$http = Axios;
        Ballpen.$util = Underscore;
        Ballpen.$cache = Cache;
        Ballpen.$cookie = Cookie;
        Ballpen.$animate = Velocity;
        // Ballpen.$wasm = WasmLoader;

        // Global variables
        Ballpen.$refs = {};

        // Others
        Ballpen.wasmCore = {}; 
        // Ballpen.wasmCore.algorithm = WasmLoader.extract(WasmBytes.Algorithm());
    }

    static registerPlugin(alias, pluginEntity) {
        Ballpen[`$${alias}`] = pluginEntity;
    }
}

export default BallpenGlobalWrapper;
