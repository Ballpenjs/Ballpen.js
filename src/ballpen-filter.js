class Filter {
    static filterParams (fnStr) {
        let parmsPath = [];
        let parm = fnStr.match(/\(([a-zA-Z0-9_$]*?)\)/i)[1];
        if (parm) {
            /* eslint-disable */
            let rawPathes = fnStr.match(new RegExp(`${parm}(\["[a-zA-Z0-9_$]+"\]|\['[a-zA-Z0-9_$]+'\]|\[[0-9]+\]|\.[a-zA-Z0-9_$]+)*`, 'ig'));
            if (rawPathes.length > 0) {
                let resultSet = new Set();

                rawPathes.forEach((value, key) => {
                    if (key > 0) {
                        resultSet.add(Filter._parseObjectToPath(value));
                    }
                });

                return Array.from(resultSet);
            }
        }

        return parmsPath;
    };

    static _parseObjectToPath(ObjStr) {
        return ObjStr.match(new RegExp(`[0-9A-Za-z]+`, 'ig')).splice(1).join('.');
    }
}

export default Filter;
