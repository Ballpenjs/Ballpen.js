class BallpenError {
    static errorEntity(aim) {
        return {
            INIT_INVALID_ROOT: {
               err: `Find an invalid root element when initializing Ballpen.js -> "${aim}"`,
               desc: 'Well, you should set a valid root element for Ballpen.js first constructor parameter, eg: "#app", "#container".'
            },
            BIND_FOR_INVALID_ALIAS: {
                err: `Invalid alias name when initializing a "bp-for" condition -> "${aim}".`,
               desc: 'Please make sure the alias name is start with a "@" symbol.'
            }
        };
    };

    static throw(entity) {
        let err = entity.err;
        let desc = entity.desc;
        let _e = new Error(`[Ballpen Parser Error] \n\n [Message] \n\n - ${err} \n\n [Description] \n\n - ${desc} \n`); 
        _e.name = 'BallpenError';     

        throw _e;           
    };

    static trigger(type, aim) {
        BallpenError.throw(BallpenError.errorEntity(aim)[type]);
    };
}

export default BallpenError;
