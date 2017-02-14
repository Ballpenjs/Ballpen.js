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
        let _attrs = el.attributes;

        for (let i = 0; i < _attrs.length; i++) {
            const _attr = _attrs.item(i);
            
            if (/bp-model=.*/ig.test(_attr)) {
                this.bindModel(el);
            }

            if (/bp-class=.*/ig.test(_attr)) {
                this.bindClass(el);
            }

            if (/bp-event=.*/ig.test(_attr)) {
                this.bindEvent(el);
            }

            if (/bp-for=.*/ig.test(_attr)) {
                this.bindFor(el);
            }
        }
    };

    parseData(str) {
        const _list = str.split('.');
        let _data;
        let p = [];

        _list.forEach((key, index) => {
            if (index === 0) {
                _data = this.dataList[key];
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
        const model = this.parseData(modelName);

        if (el.tagName === 'INPUT') {
            el.value = model.data;
        } else {
            el.innerText = model.data;
        }

        // Add to global mapper
    };

    bindClass(el) {
        const modelName = el.getAttribute('bp-class');
        const model = this.parseData(modelName);

        if (!el.classList.contains(model.data)) {
            el.classList.add(model.data);
        }
    };

    bindEvent(el) {
        let eventLabel = el.getAttribute('bp-event');
        let protoArray = eventLabel.split(/@/);

        let _fnName = protoArray[1];
        let _fnType = protoArray[0];

        // Update global event list
        this.eventList[_fnName]['type'] = _fnType;
        
        // Bind listener
        el.addEventListener(_fnType, this.eventList[_fnName]['fn']);
    };

    bindFor(el) {
        const modelName = el.getAttribute('bp-for');
        const model = this.parseData(modelName).data;

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
    }
}

export default Ballpen;
