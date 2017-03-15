import BallpenUtil from './ballpen-util.js';
import BallpenObserver from './ballpen-observer.js';
import BallpenProxy from './ballpen-proxy.js';
import BallpenDecorator from './ballpen-decorator.js';
import BallpenError from './ballpen-error.js';
import BallpenGlobalWrapper from './ballpen-global-wrapper.js';

class Ballpen {

    constructor(el, dataModel) { 
        this.$dataModel = dataModel;

        // Save instance identifier
        this.$id = this.$dataModel.name ? this.$dataModel.name.trim() : BallpenUtil.randomSequence(6);

        // Set wasm path
        if (this.$dataModel.wasmPath) {
            Ballpen.wasmPath = this.$dataModel.wasmPath.trim();
        }

        // Set $refs, $http, etc those global sets before initializaiton
        BallpenGlobalWrapper.set(Ballpen);

        // Set a global bus including all instances
        if (!Ballpen.bus) {
            Ballpen.bus = {};
        }

        Ballpen.bus[this.$id] = this.$dataModel;

        this.lifecycleHookPoint('beforeRender', this.$dataModel, () => {
            // Init EventList
            this.init(el, this.$dataModel);
            // Scan directives
            this.scan(this.$el);
        });
    };

    lifecycleHookPoint(type, dataModel, fn = null) {
        let rawData = dataModel.data;

        if (dataModel.lifecycle) {
             if (dataModel.lifecycle.beforeRender && type === 'beforeRender') {
                new Promise((resolve, reject) => {
                    return dataModel.lifecycle.beforeRender.call(this, resolve, reject, rawData);
                }).then(() => {
                    fn && fn.call(this, dataModel);
                }).catch((err) => {});
            } else if (dataModel.lifecycle.afterRneder && type === 'afterRender') {
                dataModel.lifecycle.afterRender.call(this, rawData);
            } else {
                fn && fn.call(this, dataModel);
            }
        } else {
            fn && fn.call(this, dataModel);
        }
    };

    init(el, dataModel) {
        this.$el = document.querySelector(el);

        // Handle invalid root element
        if (!this.$el) {
            BallpenError.trigger('INIT_INVALID_ROOT', el);
        }


        // Init core features
        if (dataModel.data) {
            // Set proxy to global data payload
            this.$dataListPure = dataModel.data;
            // Set an alias for pure data
            this.data = this.$dataListPure;

            this.$dataList = BallpenUtil.clone(dataModel.data);

            // Save observer data to global bus
            Ballpen.bus[this.$id]['_obs'] = this.$dataList;
        }

        // Events
        if (dataModel.events) {
            this.$eventList = {};
            this.initEventList(dataModel.events);
        }
        
        // Watchers
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
                BallpenUtil.renderObjectValueByPath(this.$dataList, path, BallpenProxy.setProxy(path, watcherQueue, this.$dataList, this.$dataListPure));
            });
        }

        // Computed
        if (dataModel.computed) {
            this.$computedList = {};
            for (let key in dataModel.computed) {
                this.$computedList[key] = {};
                this.$computedList['_reference'] = {};
                this.$computedList['_fn'] = {};
                this.$computedList['_reference'][key] = BallpenUtil.analyzeComputedReference(dataModel.computed[key].toString(), this.$dataListPure);
                this.$computedList['_fn'][key] = dataModel.computed[key];
                this.$computedList[key] = dataModel.computed[key].call(this, this.$dataListPure);
            }
        }

        // Decorators
        if (dataModel.decorators) {
            let _decoratorsModel = dataModel.decorators;
            this.$decoratorList = {};
            for (let key in _decoratorsModel) {
                this.$decoratorList[key] = _decoratorsModel[key];
            }
        }

        // Components
        if (dataModel.components) {
            
        }

        // Other initializations
        this.$registers = [];
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
                            // Single bind
                            attrsBindedList.push({
                                _bindKey: _i.name.split(':')[1],
                                _thisSubModelAbs: _i.value 
                            });
                        } else {
                            // Multi bind
                            let bindArrs = _i.value.match(/[a-zA-Z0-9_$-]+:[a-zA-Z0-9_$.\->:()]+/ig);
                            bindArrs.forEach((binder) => {
                                const _t = binder.split(/:+?/);
                                attrsBindedList.push({
                                    _bindKey: _t[0],
                                    _thisSubModelAbs: _t.slice(1).join(':') 
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
            BallpenObserver.attach(this.$registers);
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
        let _t = el.getAttribute('bp-show');
        // Get relatived decorators
        const decorators = BallpenDecorator.analyzeDecoratorDependency(_t);

        // Get absolute path of the model
        const modelName = BallpenUtil.wrapAbsPath(rootPath, decorators.modelPath); 

        BallpenUtil.ignoreInnerDirectives(modelName, [], () => {
            const model = BallpenUtil.parseData(modelName, this.$dataList, this.$computedList);
            
            // Decoration
            let _v = BallpenDecorator.decorate(this.$decoratorList, decorators, model.data);

            const _es = el.style;
            
            // Init view
            (!_v ? _es.display = 'none' : (_es.removeProperty ? _es.removeProperty('display') : _es.removeAttribute('display')));

            BallpenObserver.register(this.$registers, this.$dataList, this.$computedList, this.$dataListPure, model.path, (yetVal, nowVal) => {
                // Decoration
                let _v = BallpenDecorator.decorate(this.$decoratorList, decorators, nowVal);

                // Update view
                (!_v ? _es.display = 'none' : (_es.removeProperty ? _es.removeProperty('display') : _es.removeAttribute('display')));
            });
        });

        el.removeAttribute('bp-show');
    };

    bindModel(el, rootPath = []) {
        let _t = el.getAttribute('bp-model');
        // Get relatived decorators
        const decorators = BallpenDecorator.analyzeDecoratorDependency(_t);

        // Get absolute path of the model
        const modelName = BallpenUtil.wrapAbsPath(rootPath, decorators.modelPath);

        BallpenUtil.ignoreInnerDirectives(modelName, [], () => {
            // Handel 'for' list index
            if (/^@{([\d]+)}$/ig.test(modelName)) {
                let index = modelName.match(/^@{([\d]+)}$/)[1];

                (el.tagName === 'INPUT' ? el.value = index : el.innerText = index);
            } else {
                const model = BallpenUtil.parseData(modelName, this.$dataList, this.$computedList);
            
                // Decoration
                let _v = BallpenDecorator.decorate(this.$decoratorList, decorators, model.data);

                (el.tagName === 'INPUT' ? el.value = _v : el.innerText = _v);

                BallpenObserver.register(this.$registers, this.$dataList, this.$computedList, this.$dataListPure, model.path, (yetVal, nowVal) => {
                    // Decoration
                    let _v = BallpenDecorator.decorate(this.$decoratorList, decorators, nowVal);

                    (el.tagName === 'INPUT' ? el.value = _v : el.innerText = _v);
                });
            }
        });

        el.removeAttribute('bp-model');
    };

    bindMoustache(el, subTextNode, rootPath = []) {
        let subTextNodeValuePure = subTextNode.nodeValue;
        let subTextNodeValueRendered = subTextNode.nodeValue;
        let subPatterns = subTextNodeValueRendered.match(/{{.*?}}/ig);
        let modelsMapper = {};

        if (BallpenUtil.isArray(subPatterns) && subPatterns.length > 0) {
            subPatterns.forEach((pattern) => {
                let _t = pattern.slice(2, -2).trim();

                // Get relatived decorators
                const decorators = BallpenDecorator.analyzeDecoratorDependency(_t);

                if (/^@{([\d]+)}$/ig.test(decorators.modelPath)) {
                    modelsMapper[pattern] = decorators.modelPath.match(/^@{([\d]+)}$/)[1];
                } else {
                     // Get absolute path of the model
                    let model = BallpenUtil.parseData(BallpenUtil.wrapAbsPath(rootPath, decorators.modelPath), this.$dataList, this.$computedList);

                    // Decoration
                    let _v = BallpenDecorator.decorate(this.$decoratorList, decorators, model.data);

                    modelsMapper[pattern] = _v;

                    BallpenObserver.register(this.$registers, this.$dataList, this.$computedList, this.$dataListPure, model.path, (yetVal, nowVal) => {
                        // Decoration
                        let _v = BallpenDecorator.decorate(this.$decoratorList, decorators, nowVal);
                        let _k = model.path.join('.');

                        decorators.decorators.forEach((value) => {
                            _k += (`->:${value}`);
                        });

                        modelsMapper[`{{ ${_k} }}`] = _v;

                        for (let pattern in modelsMapper) {
                            subTextNodeValueRendered = subTextNodeValueRendered.replace(pattern, modelsMapper[pattern]);
                        }

                        subTextNode.nodeValue = subTextNodeValueRendered;
                        subTextNodeValueRendered = subTextNodeValuePure;
                    });
                }
            });
            
            for (let pattern in modelsMapper) {
                subTextNodeValueRendered = subTextNodeValueRendered.replace(pattern, modelsMapper[pattern]);
            }      
        }

        subTextNode.nodeValue = subTextNodeValueRendered;
        subTextNodeValueRendered = subTextNodeValuePure;
    };

    bindClass(el, rootPath = []) {
        let _t = el.getAttribute('bp-class');

        // Get relatived decorators
        const decorators = BallpenDecorator.analyzeDecoratorDependency(_t);

        // Get absolute path of the model
        const modelName = BallpenUtil.wrapAbsPath(rootPath, decorators.modelPath);

        BallpenUtil.ignoreInnerDirectives(modelName, [], () => {
            const model = BallpenUtil.parseData(modelName, this.$dataList, this.$computedList);

            // Decoration
            let _v = BallpenDecorator.decorate(this.$decoratorList, decorators, model.data);

            if (!el.classList.contains(_v)) {
                el.classList.add(_v);
            }

            BallpenObserver.register(this.$registers, this.$dataList, this.$computedList, this.$dataListPure, model.path, (yetVal, nowVal) => {
                // Decoration
                let _y = BallpenDecorator.decorate(this.$decoratorList, decorators, yetVal);
                let _v = BallpenDecorator.decorate(this.$decoratorList, decorators, nowVal);

                el.classList.remove(_y);
                if (!el.classList.contains(_v)) {
                    el.classList.add(_v);
                }
            });
        });

        el.removeAttribute('bp-class');
    };

    bindPre(el) {
        el.removeAttribute('bp-pre');
    }

    bindEvent(el, _fnName, _fnType, context, args = {}) {
        BallpenUtil.ignoreInnerDirectives(_fnName, [], () => {
            // Update global event list
            this.$eventList[_fnName]['type'] = _fnType;
            
            // Bind listener, set callback fn to global data context
            el.addEventListener(_fnType, () => {
                this.$eventList[_fnName]['fn'].call(this.$dataList, el, context, args);
            });
        });
    };

    bindBind(el, _bindValue, _bindKey, rootPath = []) {
        BallpenUtil.ignoreInnerDirectives(_bindValue, [], () => {
            // Get relatived decorators
            const decorators = BallpenDecorator.analyzeDecoratorDependency(_bindValue);

            // Get absolute path of the model
            const modelName = BallpenUtil.wrapAbsPath(rootPath, decorators.modelPath); 

            const model = BallpenUtil.parseData(modelName, this.$dataList, this.$computedList);

            // Decoration
            let _v = BallpenDecorator.decorate(this.$decoratorList, decorators, model.data);

            // Set customized attribute
            el.setAttribute(_bindKey, _v);
            
            // Bind listener, set callback fn to global data context
            BallpenObserver.register(this.$registers, this.$dataList, this.$computedList, this.$dataListPure, model.path, (yetVal, nowVal) => {
                // Decoration
                let _v = BallpenDecorator.decorate(this.$decoratorList, decorators, nowVal);

                el.setAttribute(_bindKey, _v);
            });
        });
    };

    bindFor(el, scope = {}, indexStack = {}) {
        const modelPaths = el.getAttribute('bp-for').split(/\s+in\s+/);
        const _pScope = modelPaths[1].split(/->:/i)[0];
        const _cScope = modelPaths[0];
        const _identifyKey = BallpenUtil.randomSequence(12);

        if (!/^@/ig.test(_cScope)) {
            BallpenError.trigger('BIND_FOR_INVALID_ALIAS', _cScope);
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

        // Only get relatived decorators, without data path
        const decorators = BallpenDecorator.analyzeDecorators(modelPaths[1]);

        // Render data model from analyzed bundle "scope[_pScope]", not from parent scope directly
        const model = BallpenUtil.parseData(scope[_pScope], this.$dataList, this.$computedList);

        // Decoration
        let _v = BallpenDecorator.decorate(this.$decoratorList, decorators, model.data, false);

        let parentNode = el.parentNode;
        let virtualDiv = document.createDocumentFragment();

        // Parent scope is a native number -> model.data
        const iterateCount = _v.length ? _v.length : _v;
        for (let i = 0; i < iterateCount; i++) {
            let _div = el.cloneNode(true);
            let _dataPath = `${scope[_pScope]}.${i}`;

            // Update current scope chain
            scope[_cScope] = _dataPath;

            // Update current index chain (start with 1)
            indexStack[_cScope] = i + 1;

            _div.removeAttribute('bp-for');
            _div.setAttribute('bp-for-rendered-id', _identifyKey);

            this.bindForItemsRecursion(_div, scope, indexStack, _dataPath, i, true, (el) => {
                virtualDiv.appendChild(el);
            });
        }

        parentNode.replaceChild(virtualDiv, el);

        // Set register
        BallpenObserver.register(this.$registers, this.$dataList, this.$computedList, this.$dataListPure, model.path, (yetVal, nowVal) => {
            let virtualDiv = document.createDocumentFragment();

            // Parent scope is a native number -> nowVal
            const iterateCount = nowVal.length ? nowVal.length : nowVal;
            for (let i = 0; i < iterateCount; i++) {
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
                    let subTextNodeValueRendered = item.nodeValue;
                    let subTextNodeValuePure = item.nodeValue;

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
                            subTextNodeValueRendered = subTextNodeValueRendered.replace(pattern, modelsMapper[pattern]);
                        }      
                    }

                    item.nodeValue = subTextNodeValueRendered;
                    subTextNodeValueRendered = subTextNodeValuePure;

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

                    _thisNode.removeAttribute(_i.name);
                }

                if (/bp-bind/ig.test(_i.name)) {
                    let attrsBindedList = [];

                    if (/bp-bind:/ig.test(_i.name)) {
                        // Single bind
                        attrsBindedList.push({
                            _bindKey: _i.name.split(':')[1],
                            _thisSubModelAbs: _i.value 
                        });
                    } else {
                        // Multi bind
                        let bindArrs = _i.value.match(/[a-zA-Z0-9_$-]+:[a-zA-Z0-9_$.\->:()]+/ig);
                        bindArrs.forEach((binder) => {
                            const _t = binder.split(/:+?/);
                            attrsBindedList.push({
                                _bindKey: _t[0],
                                _thisSubModelAbs: _t.slice(1).join(':') 
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

                    _thisNode.removeAttribute(_i.name);
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
}

export default Ballpen;
