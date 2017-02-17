class Ballpen {

    constructor(el, dataModel) { 
        // Init EventList
        this.init(el, dataModel);
        // Scan directives
        this.scan(this.el);
    };

    init(el, dataModel) {
        this.el = document.querySelector(el);

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
                let _model = Ballpen.parseData(path, this.dataList);
                let _pathes = path.split('.');
                let _dataBundle = this.dataList;

                if (!_model.data) {
                    throw new Error('[Ballpen] "' + path + '" is an invalid watch path.');
                }

                if (_pathes.length === 1) {
                    this.dataList[_pathes[0]] = this.setProxy(_model.data, path, watcherFn, watcherFn);
                } else {
                    for (let i = 0; i < _pathes.length - 1; i++) {
                        _dataBundle = _dataBundle[_pathes[i]];
                        if (!_dataBundle) {
                            throw new Error('[Ballpen] "' + path + '" is an invalid watch path.');
                        }

                        if (i === _pathes.length - 2) {
                            _dataBundle[_pathes[_pathes.length - 1]] = this.setProxy(_model.data, path, watcherFn, watcherFn);
                        }
                    }
                }
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
                fnGet && fnGet.call(this, Ballpen.parseData(path, this.dataListPure).data);
                return target[property];
            },
            set: (target, property, value, receiver) => {
                target[property] = value;
                // Run callback
                fnSet && fnSet.call(this, Ballpen.parseData(path, this.dataListPure).data);
                // Return true to accept the changes
                return true;
            },
            defineProperty: (target, prop, descriptor) => {
                return Reflect.defineProperty(target, prop, descriptor);
            }
        };

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
            let innerText = el.innerHTML;
     
            // Bind
            this.bind(_thisNode);

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
        }   
    };

    update() {
        this.removedChildNodes.forEach((node) => {
            node.remove();
        });
    }

    bind(el) {
        if (!el.hasAttributes()) {
            return;
        }

        let _attrs = el.attributes;

        for (let i = 0; i < _attrs.length; i++) {
            const _attr = _attrs.item(i);

            if (_attr.name === 'bp-model') {
                this.bindModel(el);
            }

            if (_attr.name === 'bp-class') {
                this.bindClass(el);
            }

            if (/bp-event:/ig.test(_attr.name)) {
                let _fnType = _attr.name.split(':')[1];
                let _fnName = _attr.value;
                this.bindEvent(el, _fnName, _fnType, this.dataList);
            }

            if (/bp-bind:/ig.test(_attr.name)) {
                let _bindKey   = _attr.name.split(':')[1];
                let _bindValue = _attr.value;
                this.bindBind(el, _bindValue, _bindKey);
            }

            if (_attr.name === 'bp-for') {
                this.bindFor(el);
            }

            if (_attr.name === 'bp-show') {
                this.bindShow(el);
            }
        }
    };

    static isHTMLCollection(obj) {
        return Object.prototype.toString.call(obj) === '[object HTMLCollection]';
    };

    static isArray(arr) {
        return Array.isArray(arr) || Object.prototype.toString.call(arr) === '[object Array]';
    };

    static isObject(obj) {
        return Object.prototype.toString.call(obj) === '[object Object]';
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
    }

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
    }

    bindShow(el) {
        const modelName = el.getAttribute('bp-show');

        Ballpen.ignoreInnerDirectives(modelName, [], (el) => {
            const model = Ballpen.parseData(modelName, this.dataList);

            const elStyle = el.style;
 
            (!model.data ? elStyle.display = 'none' : (elStyle.removeProperty ? elStyle.removeProperty('display') : elStyle.removeAttribute('display')));

            this.register(this.dataList, this.dataListPure, model.path, (yetVal, nowVal) => {
                (!nowVal ? elStyle.display = 'none' : (elStyle.removeProperty ? elStyle.removeProperty('display') : elStyle.removeAttribute('display')));
            });
        }, el);
    };

    bindModel(el) {
        const modelName = el.getAttribute('bp-model');

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

    bindClass(el) {
        const modelName = el.getAttribute('bp-class');

        Ballpen.ignoreInnerDirectives(modelName, [], (el) => {
            const model = Ballpen.parseData(modelName, this.dataList);

            if (!el.classList.contains(model.data)) {
                el.classList.add(model.data);
            }

            this.register(this.dataList, this.dataListPure, model.path, (yetVal, nowVal) => {
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

    bindBind(el, _bindValue, _bindKey) {
        Ballpen.ignoreInnerDirectives(_bindValue, [], (el, _bindValue, _bindKey) => {
            const model = Ballpen.parseData(_bindValue, this.dataList);

            // Set customized attribute
            el.setAttribute(_bindKey, model.data);
            
            // Bind listener, set callback fn to global data context
            this.register(this.dataList, this.dataListPure, model.path, (yetVal, nowVal) => {
                el.setAttribute(_bindKey, nowVal);
            });
        }, el, _bindValue, _bindKey);
    }

    bindFor(el) {
        const modelName = el.getAttribute('bp-for');
        const model = Ballpen.parseData(modelName, this.dataList);

        let parentNode = el.parentNode;
        let virtualDiv = document.createDocumentFragment();

        for (let i = 0; i < model.data.length; i++) {
            let div = el.cloneNode(true);
            let _dataPath = `${modelName}.${i}`;

            div.removeAttribute('bp-for');

            virtualDiv.appendChild(this.bindForItems(div, _dataPath, i));
        }

        parentNode.appendChild(virtualDiv);

        // Set register
        this.register(this.dataList, this.dataListPure, model.path, (yetVal, nowVal) => {
            let virtualDiv = document.createDocumentFragment();

            for (let i = 0; i < nowVal.length; i++) {
                let div = el.cloneNode(true);
                let _dataPath = `${modelName}.${i}`;

                virtualDiv.appendChild(this.bindForItems(div, _dataPath, i));
            }

            while (parentNode.firstChild) {
                parentNode.removeChild(parentNode.firstChild);
            }

            parentNode.appendChild(virtualDiv);
        });

        this.removedChildNodes.push(el);
    };

    bindForItemsRecursion(el, data, itemIndex) {
        let child = true;

        if (!Ballpen.isHTMLCollection(el)) {
            child = false;
        }

        for (let j = 0; j < (child ? el.length : 1); j++) {
            const _thisNode = (child ? el[j] : el);

            if (!_thisNode.hasAttributes() && child) {
                continue;
            }

            // Bind normal render tag
            let _attrsMain = _thisNode.attributes;
            
            for (let i = 0; i < _attrsMain.length; i++) {
                const _attr = _attrsMain.item(i);

                if (_attr.name === 'bp-class') {
                    let _thisSubModel = _thisNode.getAttribute('bp-class');
                    let _thisSubModelAbs = _thisSubModel;

                    if (/^@\./ig.test(_thisSubModel)) {
                        let _subModel = _thisSubModel.split('.')[1];
                        _thisSubModelAbs = data + `.${_subModel}`;
                    } else if (/^@$/ig.test(_thisSubModel)) {
                        _thisSubModelAbs = data;
                    } 

                    if (_thisSubModelAbs !== _thisSubModel) {
                        _thisNode.setAttribute('bp-class', _thisSubModelAbs);
                    }

                    this.bindClass(_thisNode);
                }

                if (/bp-event:/ig.test(_attr.name)) {
                    let _fnType = _attr.name.split(':')[1];
                    let _fnName = _attr.value;

                    if (/^@:/ig.test(_fnName)) {
                        this.bindEvent(_thisNode, _fnName.split(':')[1], _fnType, this.dataList, {
                            index: itemIndex
                        });
                    }
                }

                if (_attr.name === 'bp-model') {
                    let _thisSubModel = _thisNode.getAttribute('bp-model');
                    let _thisSubModelAbs = _thisSubModel;

                    if (/^@\./ig.test(_thisSubModel)) {
                        let _subModel = _thisSubModel.split('.')[1];
                        _thisSubModelAbs = data + `.${_subModel}`;
                    } else if (/^@$/ig.test(_thisSubModel)) {
                        _thisSubModelAbs = data;
                    } else if (/^@{index}$/ig.test(_thisSubModel)) {
                        _thisSubModelAbs = `@{${itemIndex}}`;
                    }

                    if (_thisSubModelAbs !== _thisSubModel) {
                        _thisNode.setAttribute('bp-model', _thisSubModelAbs);
                    }

                    this.bindModel(_thisNode);
                }

                if (_attr.name === 'bp-show') {
                    let _thisSubModel = _thisNode.getAttribute('bp-show');
                    let _thisSubModelAbs = _thisSubModel;

                    if (/^@\./ig.test(_thisSubModel)) {
                        let _subModel = _thisSubModel.split('.')[1];
                        _thisSubModelAbs = data + `.${_subModel}`;
                    } else if (/^@$/ig.test(_thisSubModel)) {
                        _thisSubModelAbs = data;
                    } 

                    if (_thisSubModelAbs !== _thisSubModel) {
                        _thisNode.setAttribute('bp-show', _thisSubModelAbs);
                    }

                    this.bindShow(_thisNode);
                }

                // Render 'for' list in another 'for' had not been implemented yet
            }

            if (_thisNode.children.length > 0) {
                this.bindForItemsRecursion(_thisNode.children, data, itemIndex);
            }
        }
    };

    bindForItems(el, data, itemIndex) {
        this.bindForItemsRecursion(el, data, itemIndex);
        return el;
    };

    observePath(obj, objPure, paths, fns) {
        if (Ballpen.isArray(paths)) {
            let _path = obj;
            let _pathPure = objPure;
            let _key;

            paths.forEach((key, index) => {
                if (/^\d+$/.test(key)) {
                    key = parseInt(key);
                }

                if (index < paths.length - 1) {
                    _path = _path[key];
                    _pathPure = _pathPure[key];
                } else {    
                    _key = key;
                }
            });



            this.observeKey(_path, _pathPure, _key, fns);
        }
    };

    observeKey(obj, objPure, key, fns = false) {            
        if (Ballpen.isArray(key)) {
            this.observePath(obj, objPure, key, fns);
        } else {
            let yetVal = obj[key];
            let yetValPure = objPure[key];
           
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

                            yetValPure = nowVal;
                            yetVal = nowVal;
                        }
                    },
                    enumerable: true,
                    configurable: true
                });

                Object.keys(yetVal).forEach((key) => {
                    this.observeKey(yetVal, yetValPure, key, fns);
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

                            yetValPure = nowVal;
                            yetVal = nowVal;
                        }
                    },
                    enumerable: true,
                    configurable: true
                });

                this.observeArray(yetVal, yetValPure, fns);
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

                            yetValPure = nowVal;
                            yetVal = nowVal;

                            console.log(yetValPure);
                        }
                    },
                    enumerable: true,
                    configurable: true
                });
            }
        }
    };
    
    observeArray(arr, arrPure, fns = false) {
        const mutatorMethods = ['copyWithin', 'fill', 'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'];
        const arrayProto = Array.prototype;

        // Prevent from polluting the global 'Array.prototype'
        const hijackProto = Object.create(arrayProto);

        mutatorMethods.forEach((method) => {
            Object.defineProperty(hijackProto, method, {
                enumerable: true,
                configurable: true,
                writable: true,
                value: (...args) => {
                    let yetVal = arr.slice();
                    let resultVal = arrayProto[method].call(arr, ...args);
                                    arrayProto[method].call(arrPure, ...args);
                    let nowVal = arr;
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
                objPure: objPure,
                key: key,
                fns: [fn]
            });
        }
    };

    attach() {
        this.registers.forEach((register) => {
            this.observeKey(register.obj, register.objPure, register.key, register.fns);
        });
    };

}

export default Ballpen;
