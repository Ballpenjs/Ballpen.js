class BallpenUtil {
    static findReferenceNode(obj, map = new Map(), root = '') {
        let _root = root;

        if (BallpenUtil.isObject(obj)) {
            for (let _i in obj) {
                if (BallpenUtil.isObject(obj[_i]) || BallpenUtil.isArray(obj[_i])) {
                    _root += `${_i}.`;

                    map.set(_root.slice(0, -1), []);

                    BallpenUtil.findReferenceNode(obj[_i], map, _root);
                }
            }
        } else if (BallpenUtil.isArray(obj)) {
            obj.forEach((_i, _index) => {
                if (BallpenUtil.isObject(_i) || BallpenUtil.isArray(_i)) {
                    _root += `${_index}.`;

                    map.set(_root.slice(0, -1), []);

                    BallpenUtil.findReferenceNode(_i, map, _root);
                }
            });
        }

        return map;
    }
    
	static isHTMLCollection(obj) {
        return Object.prototype.toString.call(obj) === '[object HTMLCollection]';
    };

    static isArray(arr) {
        return Array.isArray(arr) || Object.prototype.toString.call(arr) === '[object Array]';
    };

    static toArray(collection) {
        return Array.prototype.slice.call(collection);
    }

    static isObject(obj) {
        return Object.prototype.toString.call(obj) === '[object Object]';
    };

    static isReferenceType(obj) {
        return BallpenUtil.isObject(obj) || BallpenUtil.isArray(obj);
    }

    static renderObjectValueByPath(obj, path, val) {
        let _paths = path.split('.');

        if (typeof BallpenUtil.parseData(path, obj).data === 'undefined') {
            BallpenUtil.throwError(`Find an invalid watcher path when initializing Ballpen.js -> "${path}"`, 'Please make sure the watcher path you set is exist and valid.');  
        }

        if (_paths.length === 1) {
            obj[_paths[0]] = val;
        } else {
            for (let i = 0; i < _paths.length - 1; i++) {
                obj = obj[_paths[i]];
                if (!obj) {
                    BallpenUtil.throwError(`Find an invalid watcher path when initializing Ballpen.js -> "${path}"`, 'Please make sure the watcher path you set is exist and valid.');  
                }

                if (i === _paths.length - 2) {
                    obj[_paths[_paths.length - 1]] = val;
                }
            }
        }
    };

    static parseData(str, dataObj) {
        const _list = str.split('.');
        let _data = dataObj;
        let p = [];

        _list.forEach((key, index) => {
            if (index === 0) {
                _data = dataObj[key];
                p.push(key);
            } else {
                _data = _data[key];
                p.push(key);
            }
        });

        return {
            path: p,
            data: _data
        };
    };

    static ignoreInnerDirectives(directiveValue, exceptList, fn, ...args) {
        exceptList.forEach((regexp) => {
            if (regexp.test(directiveValue)) {
                fn && fn.call(this, ...args);
            }
        });

        if (!/^@/ig.test(directiveValue)) {
            fn && fn.call(this, ...args);
        }
    };

    static clone(obj) {
        let copy;

        if (obj === null || typeof obj !== 'object') return obj;

        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = BallpenUtil.clone(obj[i]);
            }
            return copy;
        }

        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = BallpenUtil.clone(obj[attr]);
            }
            return copy;
        }

        BallpenUtil.throwError('Internal error, unable to copy object, type is not supported.', 'Please contact the author to fix this issue.');  
    };

    static wrapAbsPath(rootPath, relPath) {
        return (BallpenUtil.isArray(rootPath) && rootPath.length > 0 ? (rootPath.join('.') + '.') : (rootPath.toString().length > 0 ? (rootPath.toString() + '.') : '')) + 
        (BallpenUtil.isArray(relPath) && relPath.length > 0 ? relPath.join('.') : (relPath.toString().length > 0 ? relPath.toString() : ''));
    };

    static randomSequence(n) {
        let chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
        let res = '';

        for (let i = 0; i < n; i++) {
            let id = Math.ceil(Math.random() * 35);
            res += chars[id];
        }

        return res;
    }
}

export default BallpenUtil;
