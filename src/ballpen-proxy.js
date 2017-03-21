import BallpenUtil from './ballpen-util.js';

class BallpenProxy {
	static setProxy(path, watcherQueue, dataList, dataListPure) {
        let _dist = BallpenUtil.parseData(path, dataList).data;
        let _ov = BallpenUtil.parseData(path, dataListPure).data;

        let handler = {
            get: (_target, _property) => {
                return _target[_property];
            },
            set: (_target, _property, _v, receiver) => {
                // Run callback
                if (_v !== _ov[_property]) {
                    let _pv;

                    if (BallpenUtil.isReferenceType(_v)) {
                        _ov[_property] = BallpenUtil.clone(_v);
                        _pv = BallpenUtil.clone(_v);
                    } else {
                        _ov[_property] = _v;
                        _pv = _v;
                    }

                    // Update pure data
                    BallpenUtil.renderObjectValueByPath(dataListPure, `${path}.${_property}`, _pv);
                    
                    _target[_property] = _v;

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
