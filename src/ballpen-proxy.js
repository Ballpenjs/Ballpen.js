import BallpenUtil from './ballpen-util.js';

class BallpenProxy {
	static setProxy(path, watcherQueue, dataList, dataListPure) {
        let _dist = BallpenUtil.parseData(path, dataList).data;
        let _oldVal = BallpenUtil.parseData(path, dataListPure).data;

        let handler = {
            get: (_target, _property) => {
                // Run callback
                watcherQueue.forEach((entity) => {
                    let _fn = entity.handler;
                    let _path = entity.root;

                    // _fn && _fn.call(this, BallpenUtil.parseData(_path, dataListPure).data, BallpenUtil.parseData(_path, dataList).data);
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
                    BallpenUtil.renderObjectValueByPath(dataListPure, `${path}.${_property}`, _pureVal);
                    
                    _target[_property] = _value;

                    watcherQueue.forEach((entity) => {
                        let _fn = entity.handler;
                        let _path = entity.root;

                        _fn && _fn.call(this, BallpenUtil.parseData(_path, dataListPure).data, BallpenUtil.parseData(_path, dataList).data);
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
}

export default BallpenProxy;
