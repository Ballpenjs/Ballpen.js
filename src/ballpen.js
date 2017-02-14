class Ballpen {

    constructor(el, dataModel) {
        this.el = document.querySelector(el);
        this.dataModel = dataModel;
        // Init EventList
        this.initOptions(dataModel);
        // Scan lables
        this.scan(this.el);

        this.a = {
            b: 1,
            c: 2,
            d: 3
        };

        this.observer(this.a, (...args) => {
            console.log(args);
        });
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

        if (el.tagName === 'INPUT') {
            el.value = model.data;
        } else {
            el.innerText = model.data;
        }

        // Add to global mapper
    };

    bindClass(el) {
        const modelName = el.getAttribute('bp-class');
        const model = Ballpen.parseData(modelName, this.dataList);

        if (!el.classList.contains(model.data)) {
            el.classList.add(model.data);
        }
    };

    bindEvent(el, _fnName, _fnType) {
        // Update global event list
        this.eventList[_fnName]['type'] = _fnType;
        
        // Bind listener
        el.addEventListener(_fnType, this.eventList[_fnName]['fn']);
    };

    bindFor(el) {
        const modelName = el.getAttribute('bp-for');
        const model = Ballpen.parseData(modelName, this.dataList).data;

        let virtualDiv = document.createDocumentFragment();

        for (let i = 0; i < model.length; i++) {
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

    observer(d, fn) {
        Object.keys(d).forEach((key) => {
            this.observeKey(d, key, fn);
        });
    }

    observeKey(obj, key, fn = false) {
        let yetVal = obj[key];
        if (Object.prototype.toString.call(yetVal) === '[object Object]') {
            this.observeAllKey(obj, fn);
        } else if (Object.prototype.toString.call(yetVal) === '[object Array]') {
            this.observeArray(obj, fn);
        } else {
            Object.defineProperty(obj, key, {
                get: () => {
                    return yetVal;
                },
                set: (nowVal) => {  
                    if (nowVal !== yetVal) {
                        fn && fn.call(this, yetVal, nowVal);
                    }

                    yetVal = nowVal;
                },
                enumerable: true,
                configurable: true
            });
        }
    };
    
    observeAllKey(obj, fn) {
        Object.keys(obj).forEach((key) => {
            this.observeKey(obj, key, fn);
        });
    };

    observeArray(arr, fn) {
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
                    fn && fn.call(this, yetVal, nowVal);
                    return nowVal;
                } 
            });
        });
        /* eslint-disable */
        arr.__proto__ = hijackProto;
        arr.__proto__.__proto__ === Array.prototype; // true

        // Listen normal key-value pairs
        arr.forEach((item, index) => {
            this.observeArrayItem(arr, index, fn);
        });
    };

    observeArrayItem(arr, index, fn) {
        let yetVal = arr[index];
        Object.defineProperty(arr, index, {
            get: () => {
                return yetVal;
            },
            set: (nowVal) => {  
                if (nowVal !== yetVal) {
                    fn && fn.call(this, yetVal, nowVal);
                }

                yetVal = nowVal;
            },
            enumerable: true,
            configurable: true
        });
    }
}

export default Ballpen;
