import Axios from 'axios';
import Underscore from 'underscore';
import Velocity from 'velocity-animate';

// Ballpen build-in plugins
import Cookie from 'ballpen-plugin-cookie';
import Cache from 'ballpen-plugin-cache';

// Ballpen wasm loader
import wasmLoader from './ballpen-wasm-loader.js';

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
        Ballpen.wasmLoader = wasmLoader;
        Ballpen.registerPlugin = BallpenGlobalWrapper.registerPlugin;
    }

    static registerPlugin(alias, pluginEntity) {
        Ballpen[`$${alias}`] = pluginEntity;
    }
}

export default BallpenGlobalWrapper;
