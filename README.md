<p align="center"><a href="#" target="_blank"><img width="300px" src="https://www.yhspy.com/view/github/ballpen.js/art.png?v=v0.1.3-alpha"></a></p>

<p align="center">
  <a href="https://circleci.com/gh/Becavalier/Ballpen.js/tree/master"><img src="https://img.shields.io/circleci/project/Becavalier/Ballpen.js/master.svg" alt="Build Status"></a>
  <a href="https://www.npmjs.com/package/ballpen.js"><img src="https://img.shields.io/npm/dt/ballpen.js.svg" alt="Downloads"></a>
  <a href="https://www.npmjs.com/package/ballpen.js"><img src="https://img.shields.io/npm/v/ballpen.js.svg" alt="Version"></a>
  <a href="https://www.npmjs.com/package/ballpen.js"><img src="https://img.shields.io/npm/l/ballpen.js.svg" alt="License"></a>
</p>

## Description
A tiny, lightweight mvvm framework ready for building flexible web apps.


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
  <button bp-event:click="foldTitle">{{ header.buttonTxt }}</button>
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
                    setter.$buttonTxt = '- Show -';
                }
            }
        }
    }
});
```

## Document

Coming soon.

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2017-present, YHSPY