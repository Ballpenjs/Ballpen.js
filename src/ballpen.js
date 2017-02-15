class Ballpen {

    constructor(el, dataModel) { 
        // Init EventList
        this.init(el, dataModel);
        // Scan lables
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
            this.dataList = dataModel.data;
            this.modelList = {};
        }

        // Others
        this.registers = [];
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

    scan(el) {
        for (let i = 0; i < el.children.length; i++) {
            let _thisNode = el.children[i];
            console.log(el.children.length);
            // Bind
            this.bind(_thisNode);

            // Recursion
            if (_thisNode.children.length > 0) {
                this.scan(_thisNode);
            }
        }

        this.attach();
    };

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
                this.bindEvent(el, _fnName, _fnType);
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
    }

    static isArray(arr) {
        return Array.isArray(arr) || Object.prototype.toString.call(arr) === '[object Array]';
    }

    static isObject(obj) {
        return Object.prototype.toString.call(obj) === '[object Object]';
    }

    static parseData(str, dataObj) {
        const _list = str.split('.');
        let _data;
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

    bindShow(el) {
        const modelName = el.getAttribute('bp-show');
        const model = Ballpen.parseData(modelName, this.dataList);
        const elStyle = el.style;

        (!model.data ? elStyle.display = 'none' : (elStyle.removeProperty ? elStyle.removeProperty('display') : elStyle.removeAttribute('display')));

        this.register(this.dataList, model.path, (yetVal, nowVal) => {
            (!nowVal ? elStyle.display = 'none' : (elStyle.removeProperty ? elStyle.removeProperty('display') : elStyle.removeAttribute('display')));
        });
    }

    bindModel(el) {
        const modelName = el.getAttribute('bp-model');
        const model = Ballpen.parseData(modelName, this.dataList);

        (el.tagName === 'INPUT' ? el.value = model.data : el.innerText = model.data);

        this.register(this.dataList, model.path, (yetVal, nowVal) => {
            (el.tagName === 'INPUT' ? el.value = nowVal : el.innerText = nowVal);
        });
    };

    bindClass(el) {
        const modelName = el.getAttribute('bp-class');
        const model = Ballpen.parseData(modelName, this.dataList);

        if (!el.classList.contains(model.data)) {
            el.classList.add(model.data);
        }

        this.register(this.dataList, model.path, (yetVal, nowVal) => {
            if (!el.classList.contains(nowVal)) {
                el.classList.add(nowVal);
            }
        });
    };

    bindEvent(el, _fnName, _fnType) {
        // Update global event list
        this.eventList[_fnName]['type'] = _fnType;
        
        // Bind listener, set callback fn to global data context
        el.addEventListener(_fnType, () => {
            this.eventList[_fnName]['fn'].call(this.dataList, el);
        });
    };

    bindFor(el) {
        const modelName = el.getAttribute('bp-for');
        console.log(modelName);
        const model = Ballpen.parseData(modelName, this.dataList);

        let parentNode = el.parentNode;
        let virtualDiv = document.createDocumentFragment();

        for (let i = 0; i < model.data.length; i++) {
            let div = el.cloneNode(true);
            let _dataPath = `${modelName}.${i}`;

            div.removeAttribute('bp-for');

            virtualDiv.appendChild(this.bindForItems(div, _dataPath));
        }

        parentNode.appendChild(virtualDiv);

        // Set register
        this.register(this.dataList, model.path, (yetVal, nowVal) => {
            let virtualDiv = document.createDocumentFragment();

            for (let i = 0; i < nowVal.length; i++) {
                let div = el.cloneNode(true);
                let _dataPath = `${modelName}.${i}`;

                virtualDiv.appendChild(this.bindForItems(div, _dataPath));
            }

            while (parentNode.firstChild) {
                parentNode.removeChild(parentNode.firstChild);
            }

            parentNode.appendChild(virtualDiv);
        });

        el.remove();
    };

    bindForItemsRecursion(el, data) {
        let child = true;

        if (!Ballpen.isHTMLCollection(el)) {
            child = false;
        }

        for (let j = 0; j < (child ? el.length : 1); j++) {
            const _thisNode = (child ? el[j] : el);

            if (!_thisNode.hasAttributes()) {
                continue;
            }

            // Replace for tag to normal render tag
            let _attrsFake = _thisNode.attributes;
            
            for (let i = 0; i < _attrsFake.length; i++) {
                const _attr = _attrsFake.item(i);

                if (_attr.name === 'bp-for-show') {
                    let _thisSubModel = _thisNode.getAttribute('bp-for-show');
                    let _thisSubModelAbs = data + `.${_thisSubModel}`;

                    _thisNode.setAttribute('bp-show', _thisSubModelAbs);
                    _thisNode.removeAttribute('bp-for-show');
                }

                if (_attr.name === 'bp-for-class') {
                    let _thisSubModel = _thisNode.getAttribute('bp-for-class');
                    let _thisSubModelAbs = data + `.${_thisSubModel}`;

                    _thisNode.setAttribute('bp-class', _thisSubModelAbs);
                    _thisNode.removeAttribute('bp-for-class');
                }

                if (_attr.name === 'bp-for-model') {
                    let _thisSubModel = _thisNode.getAttribute('bp-for-model');

                    let _thisSubModelAbs;

                    if (/^@\./ig.test(_thisSubModel)) {
                        let _subModel = _thisSubModel.split('.')[1];
                        _thisSubModelAbs = data + `.${_subModel}`;
                    } else if (/^@$/ig.test(_thisSubModel)) {
                        _thisSubModelAbs = data + i.toString();
                        console.log(_thisSubModelAbs);
                    }

                    _thisNode.setAttribute('bp-model', _thisSubModelAbs);
                    _thisNode.removeAttribute('bp-for-model');
                }
            }

            // Bind normal render tag
            let _attrsMain = _thisNode.attributes;
            
            for (let i = 0; i < _attrsMain.length; i++) {
                const _attr = _attrsMain.item(i);

                if (_attr.name === 'bp-class') {
                    this.bindClass(_thisNode);
                }

                if (/bp-event:/ig.test(_attr.name)) {
                    let _fnType = _attr.name.split(':')[1];
                    let _fnName = _attr.value;
                    this.bindEvent(_thisNode, _fnName, _fnType);
                }

                if (_attr.name === 'bp-model') {
                    this.bindModel(_thisNode);
                }

                if (_attr.name === 'bp-show') {
                    this.bindShow(_thisNode);
                }

                // Render 'for' list in another 'for' had not been implemented yet
            }

            if (_thisNode.children.length > 0) {
                this.bindForItemsRecursion(_thisNode.children, data);
            }
        }
    };

    bindForItems(el, data) {
        this.bindForItemsRecursion(el, data);
        return el;
    }

    observePath(obj, paths, fns) {
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

            this.observeKey(_path, _key, fns);
        }
    };

    observeKey(obj, key, fns = false) {
        if (Ballpen.isArray(key)) {
            this.observePath(obj, key, fns);
        } else {
            let yetVal = obj[key];
            if (Ballpen.isObject(yetVal)) {
                Object.keys(yetVal).forEach((key) => {
                    this.observeKey(yetVal, key, fns);
                });
            } else if (Ballpen.isArray(yetVal)) {
                this.observeArray(yetVal, fns);
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
                        }

                        yetVal = nowVal;
                    },
                    enumerable: true,
                    configurable: true
                });
            }
        }
    };
    
    observeArray(arr, fns = false) {
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
        arr.__proto__.__proto__ === Array.prototype; // true
    };

    register(obj, key, fn) {
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
                key: key,
                fns: [fn]
            });
        }
    };

    attach() {
        this.registers.forEach((register) => {
            this.observeKey(register.obj, register.key, register.fns);
        });
    };
}

export default Ballpen;
