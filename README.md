<p align="center"><a href="#" target="_blank"><img width="400px" src="https://www.yhspy.com/view/github/ballpen.js/art.png"></a></p>

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
  <h1 bp-model="header.title" bp-show="header.showTitle"></h1>
  <button bp-model="header.buttonTxt" bp-event:click="foldTitle"></button>
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
        }
    },
    watchers: {
        "header": {
            handler: (newContextData, context) => {
                if (!newContextData.showTitle) {
                    context.$buttonTxt = '- Show -';
                }
            }
        }
    }
});
```

## Document


## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2017-present, YHSPY