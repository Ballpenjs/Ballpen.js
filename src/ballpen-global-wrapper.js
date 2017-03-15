import Axios from 'axios';
import Underscore from 'underscore';
import Velocity from 'velocity-animate';

// Ballpen build-in plugins
import Cookie from 'ballpen-plugin-cookie';
import Cache from 'ballpen-plugin-cache';

// Ballpen wasm loader
import Wasm from './ballpen-wasm.js';

class BallpenGlobalWrapper {
    static set(Ballpen) {
        Ballpen.registerPlugin = BallpenGlobalWrapper.registerPlugin;

        // Bind plugins
        Ballpen.$http = Axios;
        Ballpen.$util = Underscore;
        Ballpen.$cache = Cache;
        Ballpen.$cookie = Cookie;
        Ballpen.$animate = Velocity;

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
