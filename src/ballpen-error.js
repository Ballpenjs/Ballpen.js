class Error {

    static get errorEntity() {
        return {
            INIT_INVALID_ROOT: {
               
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

    static trigger(type) {
        Error.throw(Error.errorEntity[type]);
    };
}

export default Error;
