import Axios from 'axios';
import Underscore from 'underscore';

// Ballpen build-in plugins
// import Cookie from 'ballpen-plugin-cookie';
// import Cache from 'ballpen-plugin-cache';

class BallpenGlobalWrapper {
    static set(Ballpen) {
        Ballpen.registerPlugin = BallpenGlobalWrapper.registerPlugin;

        // Bind plugins
        Ballpen.$http = Axios;
        Ballpen.$util = Underscore;
        // Ballpen.$cache = Cache;
        // Ballpen.$cookie = Cookie;

        // Global variables
        Ballpen.$refs = {};
    }

    static registerPlugin(alias, pluginEntity) {
        Ballpen[`$${alias}`] = pluginEntity;
    }
}

export default BallpenGlobalWrapper;
