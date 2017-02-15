class Ballpen {

    constructor(el, dataModel) {
        this.el = document.querySelector(el);
        this.dataModel = dataModel;
        // Init EventList
        this.initOptions(dataModel);
        // Scan lables
        this.scan(this.el);
    };

    initOptions(dataModel) {
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
        }
    };

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
        el.addEventListener(_fnType, this.eventList[_fnName]['fn'].bind(this.dataList));
    };

    bindFor(el) {
        const modelName = el.getAttribute('bp-for');
        const model = Ballpen.parseData(modelName, this.dataList);

        let virtualDiv = document.createDocumentFragment();

        for (let i = 0; i < model.data.length; i++) {
            let div = el.cloneNode(true);

            div.removeAttribute('bp-for');

            if (div.getAttribute('bp-class')) {
                this.bindClass(div);
            }

            if (div.getAttribute('bp-event')) {
                this.bindEvent(div);
            }

            let _dataPath = `${modelName}.${i}`;

            virtualDiv.appendChild(this.bindForItems(div, _dataPath));
        }

        el.parentNode.appendChild(virtualDiv);
        el.remove();

        // Set register
        this.register(this.dataList, model.path, (yetVal, nowVal) => {
            let virtualDiv = document.createDocumentFragment();

            for (let i = 0; i < nowVal.length; i++) {
                let div = el.cloneNode(true);

                if (div.getAttribute('bp-class')) {
                    this.bindClass(div);
                }

                if (div.getAttribute('bp-event')) {
                    this.bindEvent(div);
                }

                let _dataPath = `${modelName}.${i}`;

                virtualDiv.appendChild(this.bindForItems(div, _dataPath));
            }
            console.log(el);
            el.parentNode.appendChild(virtualDiv);
            el.remove();
        });
    };

    bindForItems(el, data) {
        for (let j = 0; j < el.children.length; j++) {
            const _thisNode = el.children[j];

            if (_thisNode.getAttribute('bp-class')) {
                this.bindClass(_thisNode);
            }

            if (_thisNode.getAttribute('bp-event')) {
                this.bindEvent(_thisNode);
            }

            if (_thisNode.getAttribute('bp-for-item')) {
                let _thisSubModel = _thisNode.getAttribute('bp-for-item');
                let _thisSubModelAbs = data + `.${_thisSubModel}`;

                _thisNode.setAttribute('bp-model', _thisSubModelAbs);
                _thisNode.removeAttribute('bp-for-item');
            }

            if (_thisNode.getAttribute('bp-model')) {
                this.bindModel(_thisNode);
            }

            if (_thisNode.children.length > 0) {
                this.bindForItems(_thisNode);
            }
        }

        return el;
    };

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
                    let nowVal = arrayProto[method].call(arr, ...args);
                    // Callback
                    fns && fns.forEach((fn) => {
                        fn.call(this, yetVal, nowVal);
                    }); 

                    return nowVal;
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
