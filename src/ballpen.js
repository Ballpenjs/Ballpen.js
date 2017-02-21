import BallpenUtil from './ballpen-util.js';

class Ballpen {

    constructor(el, dataModel) { 
        this.$dataModel = dataModel;

        this.lifecycleHookPoint('beforeRender', this.$dataModel, () => {
            // Init EventList
            this.init(el, this.$dataModel);
            // Scan directives
            this.scan(this.$el);
        });
    };

    lifecycleHookPoint(type, dataModel, fn = null) {
        let rawData = dataModel.data;

        if (type === 'beforeRender' && dataModel.lifecycle && dataModel.lifecycle.beforeRender) {
            new Promise((resolve, reject) => {
                return dataModel.lifecycle.beforeRender.call(this, resolve, reject, rawData);
            }).then(() => {
                fn && fn.call(this, dataModel);
            }).catch((err) => {});
        } else if (type === 'afterRender' && dataModel.lifecycle && dataModel.lifecycle.afterRender) {
            dataModel.lifecycle.afterRender.call(this, rawData);
        } else {
            fn && fn.call(this, dataModel);
        }
    };

    init(el, dataModel) {
        this.$el = document.querySelector(el);

        // Set $refs, an global set
        Ballpen.$refs = {};

        // Handle invalid root element
        if (!this.$el) {
            BallpenUtil.throwError(`Find an invalid root element when initializing Ballpen.js -> "${el}"`, 'Well, you should set a valid root element for Ballpen.js first constructor parameter, eg: "#app", "#container".');  
        }

        if (dataModel.events) {
            this.$eventList = {};
            this.initEventList(dataModel.events);
        }

        if (dataModel.data) {
            // Set proxy to global data payload
            this.$dataListPure = dataModel.data;
            // Set an alias for pure data
            this.data = this.$dataListPure;

            this.$dataList = BallpenUtil.clone(dataModel.data);
        }

        if (dataModel.watchers) {
            // Find every reference node in datalist
            this.watchersHook = BallpenUtil.findReferenceNode(this.$dataList);

            let _watchers = dataModel.watchers;

            for (let _watcher in _watchers) {
                const _watcherEntity = {
                    root: _watcher,
                    handler: _watchers[_watcher].handler
                };

                this.watchersHook.forEach((watcherQueue, path) => {
                    if (new RegExp('^' + _watcher, 'ig').test(path)) {
                        watcherQueue.push(_watcherEntity);
                    }
                });
            }

            // Mount watchers
            this.watchersHook.forEach((watcherQueue, path) => {
                BallpenUtil.renderObjectValueByPath(this.$dataList, path, this.setProxy(path, watcherQueue));
            });
        }

        // Other initializations
        this.$registers = [];
    };

    setProxy(path, watcherQueue) {
        let _dist = BallpenUtil.parseData(path, this.$dataList).data;
        let _oldVal = BallpenUtil.parseData(path, this.$dataListPure).data;

        let handler = {
            get: (_target, _property) => {
                // Run callback
                watcherQueue.forEach((entity) => {
                    let _fn = entity.handler;
                    let _path = entity.root;

                    // _fn && _fn.call(this, BallpenUtil.parseData(_path, this.$dataListPure).data, BallpenUtil.parseData(_path, this.$dataList).data);
                });
                
                return _target[_property];
            },
            set: (_target, _property, _value, receiver) => {
                // Run callback
                if (_value !== _oldVal[_property]) {
                    let _pureVal;

                    if (BallpenUtil.isReferenceType(_value)) {
                        _oldVal[_property] = BallpenUtil.clone(_value);
                        _pureVal = BallpenUtil.clone(_value);
                    } else {
                        _oldVal[_property] = _value;
                        _pureVal = _value;
                    }

                    // Update pure data
                    BallpenUtil.renderObjectValueByPath(this.$dataListPure, `${path}.${_property}`, _pureVal);
                    
                    _target[_property] = _value;

                    watcherQueue.forEach((entity) => {
                        let _fn = entity.handler;
                        let _path = entity.root;

                        _fn && _fn.call(this, BallpenUtil.parseData(_path, this.$dataListPure).data, BallpenUtil.parseData(_path, this.$dataList).data);
                    });
                }

                // Return true to accept the changes
                return true;
            },
            defineProperty: (target, prop, descriptor) => {
                return Reflect.defineProperty(target, prop, descriptor);
            }
        };

        // Can not set a proxy on a single value (!! need to be fixed !!)
        return new Proxy(_dist, handler);
    };

    initEventList(eventList) {
        if (eventList) {
            let _thisEventObject = eventList;
            for (let item in _thisEventObject) {
                this.$eventList[item]      = {};
                this.$eventList[item].type = '';
                this.$eventList[item].fn   = _thisEventObject[item];
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

                    if (/bp-event/ig.test(_attr.name)) {
                        _thisNode.removeAttribute(_attr.name);

                        let eventBindedList = [];
                        let _i = _attr;

                        if (/bp-event:/ig.test(_i.name)) {
                            // Single event
                            eventBindedList.push({
                                _fnType: _i.name.split(':')[1],
                                _fnName: _i.value 
                            });
                        } else {
                            // Multi events
                            let bindArrs = _i.value.match(/[a-zA-Z]+:[a-zA-Z0-9_$]+/ig);
                            bindArrs.forEach((binder) => {
                                eventBindedList.push({
                                    _fnType: binder.split(':')[0],
                                    _fnName: binder.split(':')[1] 
                                });
                            });
                        }

                        eventBindedList.forEach((eventBinded) => {
                            let _fnType = eventBinded._fnType;
                            let _fnName = eventBinded._fnName;

                            this.bindEvent(_thisNode, _fnName, _fnType, this.$dataList, {});
                        });
                    }

                    if (/bp-bind/ig.test(_attr.name)) {
                        _thisNode.removeAttribute(_attr.name);

                        let attrsBindedList = [];
                        let _i = _attr;

                        if (/bp-bind:/ig.test(_i.name)) {
                            // Single event
                            attrsBindedList.push({
                                _bindKey: _i.name.split(':')[1],
                                _thisSubModelAbs: _i.value 
                            });
                        } else {
                            // Multi events
                            let bindArrs = _i.value.match(/[a-zA-Z0-9_$-]+:[a-zA-Z0-9_$.]+/ig);
                            bindArrs.forEach((binder) => {
                                attrsBindedList.push({
                                    _bindKey: binder.split(':')[0],
                                    _thisSubModelAbs: binder.split(':')[1] 
                                });
                            });
                        }

                        attrsBindedList.forEach((attrsBinded) => {
                            let _bindKey = attrsBinded._bindKey;
                            let _thisSubModelAbs = attrsBinded._thisSubModelAbs;

                            this.bindBind(_thisNode, _thisSubModelAbs, _bindKey);
                        });
                    }
                }

                if (_attrsArr.includes('bp-pre')) {
                    this.bindPre(_thisNode);
                    continue;
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

                if (_attrsArr.includes('bp-ref')) {
                    this.bindRef(_thisNode);
                }
            }

            // Moustache binding
            let childNodes = _thisNode.childNodes;
            childNodes.forEach((item, key) => {
                if (item.nodeType === Node.TEXT_NODE) {
                    this.bindMoustache(_thisNode, item);
                }
            });

            // Recursion
            if (_thisNode.children.length > 0) {
                this.scan(_thisNode, false);
            }
        }

        if (init) {
            // Attach observers
            this.attach();
            // Show rendered view
            this.$el.removeAttribute('bp-shade');

            // Lifecycle hook
            this.lifecycleHookPoint('afterRender', this.$dataModel);
        }   
    };

    bindRef(el) {
        let key = el.getAttribute('bp-ref');

        if (BallpenUtil.isArray(Ballpen.$refs[key])) {
            Ballpen.$refs[key].push(el);
        } else {
            Ballpen.$refs[key] = [];
            Ballpen.$refs[key].push(el);
        }

        el.removeAttribute('bp-ref');
    };

    bindShow(el, rootPath = []) {
        const modelName = BallpenUtil.wrapAbsPath(rootPath, el.getAttribute('bp-show')); 

        BallpenUtil.ignoreInnerDirectives(modelName, [], (el) => {
            const model = BallpenUtil.parseData(modelName, this.$dataList);

            const elStyle = el.style;
 
            (!model.data ? elStyle.display = 'none' : (elStyle.removeProperty ? elStyle.removeProperty('display') : elStyle.removeAttribute('display')));

            this.register(this.$dataList, this.$dataListPure, model.path, (yetVal, nowVal) => {
                (!nowVal ? elStyle.display = 'none' : (elStyle.removeProperty ? elStyle.removeProperty('display') : elStyle.removeAttribute('display')));
            });
        }, el);

        el.removeAttribute('bp-show');
    };

    bindModel(el, rootPath = []) {
        const modelName = BallpenUtil.wrapAbsPath(rootPath, el.getAttribute('bp-model'));

        BallpenUtil.ignoreInnerDirectives(modelName, [/^@{([\d]+)}$/ig], (el) => {
            // Handel 'for' list index
            if (/^@{([\d]+)}$/ig.test(modelName)) {
                let index = modelName.match(/^@{([\d]+)}$/)[1];

                (el.tagName === 'INPUT' ? el.value = index : el.innerText = index);
            } else {
                const model = BallpenUtil.parseData(modelName, this.$dataList);

                (el.tagName === 'INPUT' ? el.value = model.data : el.innerText = model.data);

                this.register(this.$dataList, this.$dataListPure, model.path, (yetVal, nowVal) => {
                    (el.tagName === 'INPUT' ? el.value = nowVal : el.innerText = nowVal);
                });
            }
        }, el);

        el.removeAttribute('bp-model');
    };

    bindMoustache(el, subTextNode, rootPath = []) {
        let subTextNodeValuePure = subTextNode.nodeValue;
        let subTextNodeValueRendered = subTextNode.nodeValue;
        let subPatterns = subTextNodeValueRendered.match(/{{.*?}}/ig);
        let modelsMapper = {};

        if (BallpenUtil.isArray(subPatterns) && subPatterns.length > 0) {
            subPatterns.forEach((pattern) => {
                let modelName = pattern.slice(2, -2).trim();

                if (/^@{([\d]+)}$/ig.test(modelName)) {
                    modelsMapper[pattern] = modelName.match(/^@{([\d]+)}$/)[1];
                } else {
                    let model = BallpenUtil.parseData(BallpenUtil.wrapAbsPath(rootPath, modelName), this.$dataList);
                    modelsMapper[pattern] = model.data;

                    this.register(this.$dataList, this.$dataListPure, model.path, (yetVal, nowVal) => {
                        modelsMapper[`{{ ${model.path.join('.')} }}`] = nowVal;
                        for (let pattern in modelsMapper) {
                            subTextNodeValueRendered = subTextNodeValuePure.replace(pattern, modelsMapper[pattern]);
                        }

                        subTextNode.nodeValue = subTextNodeValueRendered;
                    });
                }
            });
            
            for (let pattern in modelsMapper) {
                subTextNodeValueRendered = subTextNodeValuePure.replace(pattern, modelsMapper[pattern]);
            }      
        }

        subTextNode.nodeValue = subTextNodeValueRendered;
    };

    bindClass(el, rootPath = []) {
        const modelName = BallpenUtil.wrapAbsPath(rootPath, el.getAttribute('bp-class'));

        BallpenUtil.ignoreInnerDirectives(modelName, [], (el) => {
            const model = BallpenUtil.parseData(modelName, this.$dataList);

            if (!el.classList.contains(model.data)) {
                el.classList.add(model.data);
            }

            this.register(this.$dataList, this.$dataListPure, model.path, (yetVal, nowVal) => {
                el.classList.remove(yetVal);
                if (!el.classList.contains(nowVal)) {
                    el.classList.add(nowVal);
                }
            });
        }, el);

        el.removeAttribute('bp-class');
    };

    bindPre(el) {
        el.removeAttribute('bp-pre');
    }

    bindEvent(el, _fnName, _fnType, context, args = {}) {
        BallpenUtil.ignoreInnerDirectives(_fnName, [], (el, _fnName, _fnType, context) => {
            // Update global event list
            this.$eventList[_fnName]['type'] = _fnType;
            
            // Bind listener, set callback fn to global data context
            el.addEventListener(_fnType, () => {
                this.$eventList[_fnName]['fn'].call(this.$dataList, el, context, args);
            });
        }, el, _fnName, _fnType, context, args);
    };

    bindBind(el, _bindValue, _bindKey, rootPath = []) {
        BallpenUtil.ignoreInnerDirectives(_bindValue, [], (el, _bindValue, _bindKey) => {
            const modelName = BallpenUtil.wrapAbsPath(rootPath, _bindValue);
            const model = BallpenUtil.parseData(modelName, this.$dataList);

            // Set customized attribute
            el.setAttribute(_bindKey, model.data);
            
            // Bind listener, set callback fn to global data context
            this.register(this.$dataList, this.$dataListPure, model.path, (yetVal, nowVal) => {
                el.setAttribute(_bindKey, nowVal);
            });
        }, el, _bindValue, _bindKey);
    };

    bindFor(el, scope = {}, indexStack = {}) {
        const modelPaths = el.getAttribute('bp-for').split(/\s+in\s+/);
        const _pScope = modelPaths[1];
        const _cScope = modelPaths[0];
        const _identifyKey = BallpenUtil.randomSequence(12);

        if (!/^@/ig.test(_cScope)) {
            BallpenUtil.throwError(`Invalid alias name when initializing a "bp-for" condition -> "${_cScope}".`, 'Please make sure the alias name is start with a "@" symbol.');  
        }
        
        // Update scope array
        if (/\./ig.test(_pScope)) {
            const _t = _pScope.split('.');
            scope[_pScope] = scope[_t[0]] + '.' + _t[1];
        } else {
            scope[_pScope] = _pScope;
        }

        // Set closure variables
        let closureScope = BallpenUtil.clone(scope);
        let closureIndexStack = BallpenUtil.clone(indexStack);

        const model = BallpenUtil.parseData(scope[_pScope], this.$dataList);
        
        let parentNode = el.parentNode;
        let virtualDiv = document.createDocumentFragment();

        for (let i = 0; i < model.data.length; i++) {
            let _div = el.cloneNode(true);
            let _dataPath = `${scope[_pScope]}.${i}`;

            // Update current scope chain
            scope[_cScope] = _dataPath;

            // Update current index chain
            indexStack[_cScope] = i;

            _div.removeAttribute('bp-for');
            _div.setAttribute('bp-for-rendered-id', _identifyKey);

            this.bindForItemsRecursion(_div, scope, indexStack, _dataPath, i, true, (el) => {
                virtualDiv.appendChild(el);
            });
        }

        parentNode.replaceChild(virtualDiv, el);

        // Set register
        this.register(this.$dataList, this.$dataListPure, model.path, (yetVal, nowVal) => {
            let virtualDiv = document.createDocumentFragment();

            for (let i = 0; i < nowVal.length; i++) {
                let _div = el.cloneNode(true);
                let _dataPath = `${closureScope[_pScope]}.${i}`;

                // Update current scope chain
                closureScope[_cScope] = _dataPath;

                // Update current index chain
                closureIndexStack[_cScope] = i;

                _div.removeAttribute('bp-for');
                _div.setAttribute('bp-for-rendered-id', _identifyKey);

                this.bindForItemsRecursion(_div, closureScope, closureIndexStack, _dataPath, i, true, (el) => {
                    virtualDiv.appendChild(el);
                });
            }

            let replaceChilds = parentNode.querySelectorAll(`[bp-for-rendered-id='${_identifyKey}']`);
            for (let i = 0; i < replaceChilds.length; i++) {
                if (i === 0) {
                    parentNode.replaceChild(virtualDiv, replaceChilds.item(i));
                } else {
                    replaceChilds.item(i).remove();
                }
            }
        });
    };

    bindForItemsRecursion(el, scope, indexStack, data, itemIndex, isInit = false, fn = false) {
        let child = !!BallpenUtil.isHTMLCollection(el);

        for (let j = 0; j < (child ? el.length : 1); j++) {
            const _thisNode = (child ? el[j] : el);

            // Render moustache
            let childNodes = _thisNode.childNodes;
            childNodes.forEach((item, key) => {
                if (item.nodeType === Node.TEXT_NODE) {
                    let subTextNodeValuePure = item.nodeValue;
                    let subTextNodeValueRendered = item.nodeValue;

                    let subPatterns = subTextNodeValueRendered.match(/{{.*?}}/ig);
                    let modelsMapper = {};

                    if (BallpenUtil.isArray(subPatterns) && subPatterns.length > 0) {
                        subPatterns.forEach((pattern) => {
                            let _thisSubModel = pattern.slice(2, -2).trim();
                            let _thisSubModelAbs = _thisSubModel;

                            if (/^@/ig.test(_thisSubModel)) {
                            // Get index
                                if (/\[\[index\]\]/ig.test(_thisSubModel)) {
                                    _thisSubModelAbs = '@{' + `${indexStack[_thisSubModel.match(/^(.*)\[\[index\]\]$/)[1]]}` + '}';
                                } else {
                                    _thisSubModelAbs = _thisSubModel.replace(/^@[a-z0-9A-Z_]*/, scope[_thisSubModel.split('.')[0]]);  
                                }
                            }

                            modelsMapper[pattern] = `{{ ${_thisSubModelAbs} }}`;
                        });
                        
                        for (let pattern in modelsMapper) {
                            subTextNodeValueRendered = subTextNodeValuePure.replace(pattern, modelsMapper[pattern]);
                        }      
                    }

                    item.nodeValue = subTextNodeValueRendered;

                    this.bindMoustache(_thisNode, item);
                }
            });

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
                if (/bp-event/ig.test(_i.name)) {
                    let eventBindedList = [];

                    if (/bp-event:/ig.test(_i.name)) {
                        // Single event
                        eventBindedList.push({
                            _fnType: _i.name.split(':')[1],
                            _fnName: _i.value 
                        });
                    } else {
                        // Multi events
                        let bindArrs = _i.value.match(/[a-zA-Z]+:[a-zA-Z0-9_$]+/ig);
                        bindArrs.forEach((binder) => {
                            eventBindedList.push({
                                _fnType: binder.split(':')[0],
                                _fnName: binder.split(':')[1] 
                            });
                        });
                    }

                    eventBindedList.forEach((eventBinded) => {
                        let _fnType = eventBinded._fnType;
                        let _fnName = eventBinded._fnName;

                        if (/^@:/ig.test(_fnName)) {
                            this.bindEvent(_thisNode, _fnName.split(':')[1], _fnType, this.$dataList, {
                                index: itemIndex
                            });
                        } else {
                            this.bindEvent(_thisNode, _fnName, _fnType, this.$dataList, {});
                        }
                    });
                }

                if (/bp-bind/ig.test(_i.name)) {
                    let attrsBindedList = [];

                    if (/bp-bind:/ig.test(_i.name)) {
                        // Single event
                        attrsBindedList.push({
                            _bindKey: _i.name.split(':')[1],
                            _thisSubModelAbs: _i.value 
                        });
                    } else {
                        // Multi events
                        let bindArrs = _i.value.match(/[a-zA-Z0-9_$-]+:[a-zA-Z0-9_$.]+/ig);
                        bindArrs.forEach((binder) => {
                            attrsBindedList.push({
                                _bindKey: binder.split(':')[0],
                                _thisSubModelAbs: binder.split(':')[1] 
                            });
                        });
                    }

                    attrsBindedList.forEach((attrsBinded) => {
                        let _bindKey = attrsBinded._bindKey;
                        let _thisSubModelAbs = attrsBinded._thisSubModelAbs;

                        if (/^@/ig.test(_thisSubModelAbs)) {
                            _thisSubModelAbs = _thisSubModelAbs.replace(/^@[a-z0-9A-Z_]*/, scope[_thisSubModelAbs.split('.')[0]]);
                        }

                        this.bindBind(_thisNode, _thisSubModelAbs, _bindKey);
                    });
                }
            }

            // Render 'for' list in another 'for' list
            if (_attrsArr.includes('bp-for')) {
                this.bindFor(_thisNode, scope, indexStack);
                continue;
            }

            if (_attrsArr.includes('bp-ref')) {
                this.bindRef(_thisNode);
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
                        _thisSubModelAbs = '@{' + `${indexStack[_thisSubModel.match(/^(.*)\[\[index\]\]$/)[1]]}` + '}';
                    } else if (/@{\d+}/ig.test(_thisSubModel)) {
                        _thisSubModelAbs = _thisSubModel;
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
        if (BallpenUtil.isArray(paths)) {
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
        if (BallpenUtil.isArray(key)) {
            this.observePath(obj, rootPath, key, fns);
        } else {
            let yetVal = obj[key];
            const currentPath = rootPath;
           
            if (BallpenUtil.isObject(yetVal)) {
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

                            BallpenUtil.renderObjectValueByPath(this.$dataListPure, currentPath, nowVal);
                        }
                    },
                    enumerable: true,
                    configurable: true
                });

                Object.keys(yetVal).forEach((key) => {
                    this.observeKey(yetVal, currentPath + '.' + key, key, fns);
                });
            } else if (BallpenUtil.isArray(yetVal)) {
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

                            BallpenUtil.renderObjectValueByPath(this.$dataListPure, currentPath, nowVal);
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

                            BallpenUtil.renderObjectValueByPath(this.$dataListPure, currentPath, nowVal);
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

                    BallpenUtil.renderObjectValueByPath(this.$dataListPure, currentPath, nowVal);
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
        const register = this.$registers.find((item) => {
            if (Object.is(item.obj, obj) && (item.key === key || item.key.toString() === key.toString())) {
                return item;
            }
        });

        if (register) {
            register.fns.push(fn);
        } else {
            this.$registers.push({
                obj: obj,
                rootPath: [],
                key: key,
                fns: [fn]
            });
        }
    };

    attach() {
        this.$registers.forEach((register) => {
            this.observeKey(register.obj, register.rootPath, register.key, register.fns);
        });
    };

}

export default Ballpen;
