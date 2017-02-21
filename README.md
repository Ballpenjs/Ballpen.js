<p align="center"><a href="#" target="_blank"><img width="300px" src="https://www.yhspy.com/view/github/ballpen.js/art.png?v=v0.1.3-alpha"></a></p>

<p align="center">
  <a href="https://circleci.com/gh/Becavalier/Ballpen.js/tree/master"><img src="https://img.shields.io/circleci/project/Becavalier/Ballpen.js/master.svg" alt="Build Status"></a>
  <a href="https://www.npmjs.com/package/ballpen.js"><img src="https://img.shields.io/npm/dt/ballpen.js.svg" alt="Downloads"></a>
  <a href="https://www.npmjs.com/package/ballpen.js"><img src="https://img.shields.io/npm/v/ballpen.js.svg" alt="Version"></a>
  <a href="https://www.npmjs.com/package/ballpen.js"><img src="https://img.shields.io/npm/l/ballpen.js.svg" alt="License"></a>
</p>

## Description
**Ballpen.js** is a tiny, lightweight mvvm framework ready for building flexible web apps. It's very easy to use, and you can get it into your work only after a few minutes's quick learning.

## Installation

``` shell
npm install ballpen.js --save
```

## Quick Start

```html
<!-- html -->
<div id="app">
  <h1 bp-show="header.showTitle">{{ header.title }}</h1>
  <input type="text" bp-model="header.title" bp-event:input="syncTitle"></input>
  <button bp-event:click="foldTitle">
    <span>{{ header.buttonTxt }}</span>
  </button>
</div>
```

```javascript
// javascript
let data = {
    header: {
        showTitle: true,
        title: "It's a sunny day!",
        buttonTxt: "- Fold -"
    }
};

new Ballpen("#app", {
    data: data,
    event: {
        foldTitle: (el, context, args) => {
            context.header.showTitle = !context.header.showTitle;
        },
        syncTitle: (el, context, args) => {
            context.title = el.value;
        }
    },
    watchers: {
        "header": {
            handler: (getter, setter) => {
                if (!getter.showTitle) {
                    setter.$buttonTxt = '- Unfold -';
                } else {
                    setter.$buttonTxt = '- Fold -';
                }
            }
        }
    }
});
```

## Directives

* **bp-model**

> 'bp-model' is used for binding data to a distinct DOM element. For normal DOM element, 'bp-model' will bind data instead of its `innerHTML` attribute. For `<input>` like element, 'bp-model' will bind data instead of its `value` attribute. 'bp-model' will ignore the moustache style template within the DOM label.

> e.g: [examples/bp-model.html](https://github.com/Becavalier/Ballpen.js/blob/master/examples/bp-model.html)

* **bp-class**

> 'bp-class' is used for binding DOM elements' class name with distinct data.

> e.g: [examples/bp-class.html](https://github.com/Becavalier/Ballpen.js/blob/master/examples/bp-class.html)

* **bp-for**

> 'bp-for' is used for rendering DOM element with `Array` like data, ballpen.js will automatically rendering DOM, copying and binding them to a distinct amount the same as `Array`'s length'.

> e.g: [examples/bp-for.html](https://github.com/Becavalier/Ballpen.js/blob/master/examples/bp-for.html)

* **bp-event**

> 'bp-event' is used for binding events to DOM elements.

> e.g: [examples/bp-event.html](https://github.com/Becavalier/Ballpen.js/blob/master/examples/bp-event.html)

* **bp-bind**

> 'bp-bind' is used for binding regular or customized attributes to DOM elements.

> e.g: [examples/bp-bind.html](https://github.com/Becavalier/Ballpen.js/blob/master/examples/bp-bind.html)

* **bp-pre**

> 'bp-pre' is used for prevent distict DOM element from being rendered by ballpen.js.

> e.g: [examples/bp-pre.html](https://github.com/Becavalier/Ballpen.js/blob/master/examples/bp-pre.html)

* **bp-shade**

> 'bp-shade' is used for hiding all of the rendering areas before render is getting done.

> e.g: [examples/bp-shade.html](https://github.com/Becavalier/Ballpen.js/blob/master/examples/bp-shade.html)


* **bp-show**

> 'bp-show' is used for hiding or displaying elements according to distinct data's value.

> e.g: [examples/bp-show.html](https://github.com/Becavalier/Ballpen.js/blob/master/examples/bp-show.html)


## Core Features

* **Moustache Template**

> You can use 'Moustache Template' to bind data to DOM elements flexibly, with a data path inside this symbol `{{}}`, ballpen.js will automatically rendering 'Moustache Template' with corresponding data, and make it a 'Two-Way Data Binding'. 

> e.g: [examples/moustache.html](https://github.com/Becavalier/Ballpen.js/blob/master/examples/moustache.html)

* **Data Watcher**

> You can use 'Watcher' to watch your data flow's changes, according to the changes, you can do everything what you want. ****Please take care that you can just set a watcher on an object or an array, not on any single normal data.****

> e.g: [examples/watcher.html](https://github.com/Becavalier/Ballpen.js/blob/master/examples/watcher.html)

## Instance Properties

* **.data**

> You can access the 'data' attribute from an constructed instance object. According to this attribute, you can get all the constructing data of the current status.

> e.g: [examples/instance-data.html](https://github.com/Becavalier/Ballpen.js/blob/master/examples/instance-data.html)



## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2017-present, YHSPY