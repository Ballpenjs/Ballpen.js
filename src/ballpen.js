class Ballpen {

    constructor(el, dataModel) { 
        // Init EventList
        this.init(el, dataModel);
        // Scan directives
        this.scan(this.el);
    };

    init(el, dataModel) {
        this.el = document.querySelector(el);
        // Hide before render
        this.el.style.display = 'none';

        // Handle invalid root element
        if (!this.el) {
            throw new Error('[Ballpen] Invalid root element!');    
        }

        this.dataModel = dataModel;

        if (dataModel.event) {
            this.eventList = {};
            this.initEventList(dataModel.event);
        }

        if (dataModel.data) {
            // Set proxy to global data payload
            this.dataListPure = dataModel.data;
            this.dataList = Ballpen.clone(dataModel.data);
            this.modelList = {};
        }

        if (dataModel.watchers) {
            this.watchersHook = new Map();

            let _watchers = dataModel.watchers;

            for (let watcher in _watchers) {
                const _dataPath = watcher;
                const _dataHook = _watchers[watcher].handler;

                this.watchersHook.set(_dataPath, _dataHook);
            }

            this.watchersHook.forEach((watcherFn, path) => {
                Ballpen.renderObjectValueByPath(this.dataList, path, this.setProxy(Ballpen.parseData(path, this.dataList).data, path, watcherFn, watcherFn));
            });
        }

        // Other initializations
        this.registers = [];
        this.removedChildNodes = [];
    };

    setProxy(dataList, path, fnSet = false, fnGet = false) {
        let handler = {
            get: (target, property) => {
                // Run callback
                fnGet && fnGet.call(this, Ballpen.parseData(path, this.dataListPure).data, Ballpen.parseData(path, this.dataList).data);
                return target[property];
            },
            set: (target, property, value, receiver) => {
                let realProperty;
                if (/^\$/ig.test(property)) {
                    realProperty = property.substring(1);
                } else {
                    realProperty = property;
                }

                target[realProperty] = value;
                // Run callback
                if (realProperty === property) {
                    fnSet && fnSet.call(this, Ballpen.parseData(path, this.dataListPure).data, Ballpen.parseData(path, this.dataList).data);
                }
                
                // Return true to accept the changes
                return true;
            },
            defineProperty: (target, prop, descriptor) => {
                return Reflect.defineProperty(target, prop, descriptor);
            }
        };

        // Can not set a proxy on a single value (!! need to be fixed !!)
        return new Proxy(dataList, handler);
    };

    initEventList(eventList) {
        if (eventList) {
            let _thisEventObject = eventList;
            for (let item in _thisEventObject) {
                this.eventList[item]      = {};
                this.eventList[item].type = '';
                this.eventList[item].fn   = _thisEventObject[item];
            }
        }
    };

    scan(el, init = true) {
        for (let i = 0; i < el.children.length; i++) {
            let _thisNode = el.children[i];
     
            // Bind
            if (_thisNode.hasAttributes()) {
                let _attrs = _thisNode.attributes;
                let _attrsArr = [];

                for (let i = 0; i < _attrs.length; i++) {
                    const _attr = _attrs.item(i);
                    _attrsArr.push(_attr.name);

                    if (/bp-event:/ig.test(_attr.name)) {
                        let _fnType = _attr.name.split(':')[1];
                        let _fnName = _attr.value;
                        this.bindEvent(_thisNode, _fnName, _fnType, this.dataList);
                    }

                    if (/bp-bind:/ig.test(_attr.name)) {
                        let _bindKey   = _attr.name.split(':')[1];
                        let _bindValue = _attr.value;
                        this.bindBind(_thisNode, _bindValue, _bindKey);
                    }
                }

                if (_attrsArr.includes('bp-for')) {
                    this.bindFor(_thisNode);
                    continue;
                }

                if (_attrsArr.includes('bp-model')) {
                    this.bindModel(_thisNode);
                }

                if (_attrsArr.includes('bp-class')) {
                    this.bindClass(_thisNode);
                }

                if (_attrsArr.includes('bp-show')) {
                    this.bindShow(_thisNode);
                }

                // Moustache binding
                if (/{{.*}}/ig.test(_thisNode.innerText)) {
                    this.bindMoustache(_thisNode);
                }
            }

            // Recursion
            if (_thisNode.children.length > 0) {
                this.scan(_thisNode, false);
            }
        }

        if (init) {
            // Update view
            this.update();
            // Attach observers
            this.attach();
            // Show rendered view
            (this.el.style.removeProperty ? this.el.style.removeProperty('display') : this.el.style.removeAttribute('display'));
        }   
    };

    update() {
        this.removedChildNodes.forEach((node) => {
            node.remove();
        });
    }

    static isHTMLCollection(obj) {
        return Object.prototype.toString.call(obj) === '[object HTMLCollection]';
    };

    static isArray(arr) {
        return Array.isArray(arr) || Object.prototype.toString.call(arr) === '[object Array]';
    };

    static isObject(obj) {
        return Object.prototype.toString.call(obj) === '[object Object]';
    };

    static renderObjectValueByPath(obj, path, val) {
        let _paths = path.split('.');

        if (typeof Ballpen.parseData(path, obj).data === 'undefined') {
            throw new Error('[Ballpen] "' + path + '" is an invalid watch path.');
        }

        if (_paths.length === 1) {
            obj[_paths[0]] = val;
        } else {
            for (let i = 0; i < _paths.length - 1; i++) {
                obj = obj[_paths[i]];
                if (!obj) {
                    throw new Error('[Ballpen] "' + path + '" is an invalid watch path.');
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
                copy[i] = Ballpen.clone(obj[i]);
            }
            return copy;
        }

        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = Ballpen.clone(obj[attr]);
            }
            return copy;
        }

        throw new Error('[Ballpen] Unable to copy object, type is not supported.');
    };

    static wrapAbsPath(rootPath, relPath) {
        return (Ballpen.isArray(rootPath) && rootPath.length > 0 ? (rootPath.join('.') + '.') : (rootPath.toString().length > 0 ? (rootPath.toString() + '.') : '')) + 
        (Ballpen.isArray(relPath) && relPath.length > 0 ? relPath.join('.') : (relPath.toString().length > 0 ? relPath.toString() : ''));
    };

    bindShow(el, rootPath = []) {
        const modelName = Ballpen.wrapAbsPath(rootPath, el.getAttribute('bp-show')); 

        Ballpen.ignoreInnerDirectives(modelName, [], (el) => {
            const model = Ballpen.parseData(modelName, this.dataList);

            const elStyle = el.style;
 
            (!model.data ? elStyle.display = 'none' : (elStyle.removeProperty ? elStyle.removeProperty('display') : elStyle.removeAttribute('display')));

            this.register(this.dataList, this.dataListPure, model.path, (yetVal, nowVal) => {
                (!nowVal ? elStyle.display = 'none' : (elStyle.removeProperty ? elStyle.removeProperty('display') : elStyle.removeAttribute('display')));
            });
        }, el);
    };

    bindModel(el, rootPath = []) {
        const modelName = Ballpen.wrapAbsPath(rootPath, el.getAttribute('bp-model'));

        Ballpen.ignoreInnerDirectives(modelName, [/^@{([\d]+)}$/ig], (el) => {
            // Handel 'for' list index
            if (/^@{([\d]+)}$/ig.test(modelName)) {
                let index = modelName.match(/^@{([\d]+)}$/)[1];

                (el.tagName === 'INPUT' ? el.value = index : el.innerText = index);
            } else {
                const model = Ballpen.parseData(modelName, this.dataList);

                (el.tagName === 'INPUT' ? el.value = model.data : el.innerText = model.data);

                this.register(this.dataList, this.dataListPure, model.path, (yetVal, nowVal) => {
                    (el.tagName === 'INPUT' ? el.value = nowVal : el.innerText = nowVal);
                });
            }
        }, el);
    };

    bindMoustache(el) {

    };

    bindClass(el, rootPath = []) {
        const modelName = Ballpen.wrapAbsPath(rootPath, el.getAttribute('bp-class'));

        Ballpen.ignoreInnerDirectives(modelName, [], (el) => {
            const model = Ballpen.parseData(modelName, this.dataList);

            if (!el.classList.contains(model.data)) {
                el.classList.add(model.data);
            }

            this.register(this.dataList, this.dataListPure, model.path, (yetVal, nowVal) => {
                el.classList.remove(yetVal);
                if (!el.classList.contains(nowVal)) {
                    el.classList.add(nowVal);
                }
            });
        }, el);
    };

    bindEvent(el, _fnName, _fnType, context, args = {}) {
        Ballpen.ignoreInnerDirectives(_fnName, [], (el, _fnName, _fnType, context) => {
            // Update global event list
            this.eventList[_fnName]['type'] = _fnType;
            
            // Bind listener, set callback fn to global data context
            el.addEventListener(_fnType, () => {
                this.eventList[_fnName]['fn'].call(this.dataList, el, context, args);
            });
        }, el, _fnName, _fnType, context, args);
    };

    bindBind(el, _bindValue, _bindKey, rootPath = []) {
        Ballpen.ignoreInnerDirectives(_bindValue, [], (el, _bindValue, _bindKey) => {
            const modelName = Ballpen.wrapAbsPath(rootPath, _bindValue);
            const model = Ballpen.parseData(modelName, this.dataList);

            // Set customized attribute
            el.setAttribute(_bindKey, model.data);
            
            // Bind listener, set callback fn to global data context
            this.register(this.dataList, this.dataListPure, model.path, (yetVal, nowVal) => {
                el.setAttribute(_bindKey, nowVal);
            });
        }, el, _bindValue, _bindKey);
    };

    bindFor(el, scope = {}, indexStack = {}) {
        console.trace(scope);
        const modelPaths = el.getAttribute('bp-for').split(/\s+in\s+/);
        const _pScope = modelPaths[1];
        const _cScope = modelPaths[0];
        
        // Update scope array
        if (/\./ig.test(_pScope)) {
            const _t = _pScope.split('.');
            scope[_pScope] = scope[_t[0]] + '.' + _t[1];
        } else {
            scope[_pScope] = _pScope;
        }
        console.log(scope);
        console.log(_pScope);
        console.trace(scope[_pScope]);
        const model = Ballpen.parseData(scope[_pScope], this.dataList);
        
        let parentNode = el.parentNode;
        console.log(parentNode);
        let virtualDiv = document.createDocumentFragment();

        for (let i = 0; i < model.data.length; i++) {
            let _div = el.cloneNode(true);
            let _dataPath = `${scope[_pScope]}.${i}`;

            // Update current scope chain
            scope[_cScope] = _dataPath;

            // Update current index chain
            indexStack[_cScope] = i;

            _div.removeAttribute('bp-for');

            this.bindForItemsRecursion(_div, scope, indexStack, _dataPath, i, true, (el) => {
                virtualDiv.appendChild(el);
            });
        }

        parentNode.appendChild(virtualDiv);
        console.log(indexStack);
        // Set register
        this.register(this.dataList, this.dataListPure, model.path, (yetVal, nowVal) => {
            let virtualDiv = document.createDocumentFragment();

            for (let i = 0; i < nowVal.length; i++) {
                let _div = el.cloneNode(true);
                let _dataPath = `${scope[_pScope]}.${i}`;

                // Update current scope chain
                scope[_cScope] = _dataPath;

                // Update current index chain
                indexStack[_cScope] = i;

                this.bindForItemsRecursion(_div, scope, indexStack, _dataPath, i, true, (el) => {
                    virtualDiv.appendChild(el);
                });
            }

            while (parentNode.firstChild) {
                parentNode.removeChild(parentNode.firstChild);
            }

            parentNode.appendChild(virtualDiv);
        });

        this.removedChildNodes.push(el);
    };

    bindForItemsRecursion(el, scope, indexStack, data, itemIndex, isInit = false, fn = false) {
        let child = !!Ballpen.isHTMLCollection(el);

        for (let j = 0; j < (child ? el.length : 1); j++) {
            const _thisNode = (child ? el[j] : el);

            if (!_thisNode.hasAttributes() && child) {
                if (_thisNode.children.length > 0) {
                    this.bindForItemsRecursion(_thisNode.children, scope, indexStack, data, itemIndex);
                }
                continue;
            }

            // Bind normal render tag
            let _attrsMain = _thisNode.attributes;
            let _attrsArr = [];

            for (let i = 0; i < _attrsMain.length; i++) {
                let _i = _attrsMain.item(i);
                _attrsArr.push(_i.name);

                // Bind event
                if (/bp-event:/ig.test(_i.name)) {
                    let _fnType = _i.name.split(':')[1];
                    let _fnName = _i.value;

                    if (/^@:/ig.test(_fnName)) {
                        this.bindEvent(_thisNode, _fnName.split(':')[1], _fnType, this.dataList, {
                            index: itemIndex
                        });
                    }
                }
            }

            // Render 'for' list in another 'for' list
            if (_attrsArr.includes('bp-for')) {
                console.log(111);
                this.bindFor(_thisNode, scope, indexStack);
                continue;
            }

            if (_attrsArr.includes('bp-class')) {
                let _thisSubModel = _thisNode.getAttribute('bp-class');  
                let _thisSubModelAbs = _thisSubModel;

                if (/^@/ig.test(_thisSubModel)) {
                    _thisSubModelAbs = _thisSubModel.replace(/^@[a-z0-9A-Z_]*/, scope[_thisSubModel.split('.')[0]]);
                }

                if (_thisSubModelAbs !== _thisSubModel) {
                    _thisNode.setAttribute('bp-class', _thisSubModelAbs);
                }

                this.bindClass(_thisNode);
            }

            if (_attrsArr.includes('bp-model')) {
                let _thisSubModel = _thisNode.getAttribute('bp-model');
                let _thisSubModelAbs = _thisSubModel;

                if (/^@/ig.test(_thisSubModel)) {
                    // Get index
                    if (/\[\[index\]\]/ig.test(_thisSubModel)) {
                        console.log(_thisSubModel);
                        _thisSubModelAbs = `@{${indexStack[_thisSubModel.match(/^(.*)\[\[index\]\]$/)[1]]}}`;

                    } else {
                        _thisSubModelAbs = _thisSubModel.replace(/^@[a-z0-9A-Z_]*/, scope[_thisSubModel.split('.')[0]]);  
                    }
                }

                if (_thisSubModelAbs !== _thisSubModel) {
                    _thisNode.setAttribute('bp-model', _thisSubModelAbs);
                }

                this.bindModel(_thisNode);
            }

            if (_attrsArr.includes('bp-show')) {
                let _thisSubModel = _thisNode.getAttribute('bp-show');
                let _thisSubModelAbs = _thisSubModel;

                if (/^@/ig.test(_thisSubModel)) {
                    _thisSubModelAbs = _thisSubModel.replace(/^@[a-z0-9A-Z_]*/, scope[_thisSubModel.split('.')[0]]);
                }

                if (_thisSubModelAbs !== _thisSubModel) {
                    _thisNode.setAttribute('bp-show', _thisSubModelAbs);
                }

                this.bindShow(_thisNode);
            }

            if (_thisNode.children.length > 0) {
                this.bindForItemsRecursion(_thisNode.children, scope, indexStack, data, itemIndex);
            }
        }

        if (isInit) {
            fn && fn.call(this, el);
        }
    };

    observePath(obj, rootPath, paths, fns) {
        if (Ballpen.isArray(paths)) {
            let _path = obj;
            let _key;

            paths.forEach((key, index) => {
                if (/^\d+$/.test(key)) {
                    key = parseInt(key);
                }

                if (index < paths.length - 1) {
                    _path = _path[key];
                } else {    
                    _key = key;
                }
            });

            rootPath = paths.join('.');

            this.observeKey(_path, rootPath, _key, fns);
        }
    };

    observeKey(obj, rootPath, key, fns = false) {            
        if (Ballpen.isArray(key)) {
            this.observePath(obj, rootPath, key, fns);
        } else {
            let yetVal = obj[key];
            const currentPath = rootPath;
           
            if (Ballpen.isObject(yetVal)) {
                Object.defineProperty(obj, key, {
                    get: () => {
                        return yetVal;
                    },
                    set: (nowVal) => {  
                        if (nowVal !== yetVal) {
                            fns && fns.forEach((fn) => {
                                fn.call(this, yetVal, nowVal);
                            });

                            yetVal = nowVal;

                            Ballpen.renderObjectValueByPath(this.dataListPure, currentPath, nowVal);
                        }
                    },
                    enumerable: true,
                    configurable: true
                });

                Object.keys(yetVal).forEach((key) => {
                    this.observeKey(yetVal, currentPath + '.' + key, key, fns);
                });
            } else if (Ballpen.isArray(yetVal)) {
                Object.defineProperty(obj, key, {
                    get: () => {
                        return yetVal;
                    },
                    set: (nowVal) => {  
                        if (nowVal !== yetVal) {
                            fns && fns.forEach((fn) => {
                                fn.call(this, yetVal, nowVal);
                            });

                            yetVal = nowVal;

                            Ballpen.renderObjectValueByPath(this.dataListPure, currentPath, nowVal);
                        }
                    },
                    enumerable: true,
                    configurable: true
                });

                this.observeArray(yetVal, currentPath, fns);
            } else {
                Object.defineProperty(obj, key, {
                    get: () => {
                        return yetVal;
                    },
                    set: (nowVal) => {  
                        if (nowVal !== yetVal) {
                            fns && fns.forEach((fn) => {
                                fn.call(this, yetVal, nowVal);
                            });

                            yetVal = nowVal;

                            Ballpen.renderObjectValueByPath(this.dataListPure, currentPath, nowVal);
                        }
                    },
                    enumerable: true,
                    configurable: true
                });
            }
        }
    };
    
    observeArray(arr, rootPath, fns = false) {
        const mutatorMethods = ['copyWithin', 'fill', 'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'];
        const arrayProto = Array.prototype;

        // Prevent from polluting the global 'Array.prototype'
        const hijackProto = Object.create(arrayProto);

        const currentPath = rootPath;

        mutatorMethods.forEach((method) => {
            Object.defineProperty(hijackProto, method, {
                enumerable: true,
                configurable: true,
                writable: true,
                value: (...args) => {
                    let yetVal = arr.slice();
                    let resultVal = arrayProto[method].call(arr, ...args);
                    let nowVal = arr;

                    Ballpen.renderObjectValueByPath(this.dataListPure, currentPath, nowVal);
                    // Callback
                    fns && fns.forEach((fn) => {
                        fn.call(this, yetVal, nowVal);
                    }); 

                    return resultVal;
                } 
            });
        });
        /* eslint-disable */
        arr.__proto__ = hijackProto;
        // arr.__proto__.__proto__ === Array.prototype; // true
    };

    register(obj, objPure, key, fn) {
        const register = this.registers.find((item) => {
            if (Object.is(item.obj, obj) && (item.key === key || item.key.toString() === key.toString())) {
                return item;
            }
        });

        if (register) {
            register.fns.push(fn);
        } else {
            this.registers.push({
                obj: obj,
                rootPath: [],
                key: key,
                fns: [fn]
            });
        }
    };

    attach() {
        this.registers.forEach((register) => {
            this.observeKey(register.obj, register.rootPath, register.key, register.fns);
        });
    };

}

export default Ballpen;
