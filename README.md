<p align="center"><a href="#" target="_blank"><img width="100" src="https://github.com/Becavalier/Ballpen.js/blob/master/art/art.jpg"></a></p>

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

## Usage

```css
<!-- html -->
.todo {
    color: red;
    font-weight: bold;
}
```

```<!DOCTYPE html>
<html>
<head>
    <title></title>
</head>
<body>

</body>
</html>
<!-- html -->
<div id="app">
  <h1 bp-model="header.title" bp-show="showTitle"></h1>
  <input type="text" bp-model="header.title" bp-event:input="syncTitle">
  <button bp-event:click="foldTitle" bp-model="header.btnTitle"></button>
  <br/>
  <ul>
    <li bp-for="todoList" bp-class="todoStyle" bp-show="@.showTodo">
        <!-- Get the 'for' circulation index by @{index}, '@' means current 'bp-for' context, '{}' means current circulation's inner attribute -->
        <h2 bp-model="@{index}"></h2>
        <!-- Get corresponding attributes -->
        <p bp-model="@.title"></p>
        <p bp-model="@.content"></p>
        <!-- Set an event handler within this circulation scope with '@:' -->
        <button bp-event:click="@:doneTodoItem">- Done -</button>
    </li>
  </ul>
  <button bp-bind:name="name" bp-event:click="reverseName" bp-model="name"></button>
</div>
```

```javascript
// javascript
let data = {
    showTitle: true,
    header: {
        title: "It's a sunny day!",
        btnTitle: "Toggle Title"
    },
    todoList: [
        {
            title: "Health",
            content: "Get up earlier!",
            showTodo: true
        },
        {
            title: "Health",
            content: "Never stay up too late!",
            showTodo: true
        },
        {
            title: "Emotion",
            content: "Happy everyday!",
            showTodo: true
        }
    ],
    todoStyle: "todo",
    name: "YHSPY - Ballpen.js"
};

new Ballpen("#app", {
    data: data,
    event: {
        foldTitle: (el, context, args) => {
            // 'context' => global data context
            context.showTitle = !context.showTitle;
        },
        syncTitle: (el, context, args) => {
            context.header.title = el.value; // 'el' is the dom element you bind with this method
        },
        doneTodoItem: (el, context, args) => {
            // 'args' =>> attached relative data
            context.todoList[args.index].showTodo = false;
        },
        reverseName: (el, context, args) => {
            context.name = context.name.split('').reverse().join('');
        }
    },
    watchers: {
        "todoList.0": {
            handler: (newContextData, context) => {
                if (!newContextData.showTodo) {
                    alert("You have done the first todo!");
                }
            }
        },
        "header": {
            handler: (newContextData, context) => {
                if (newContextData.title === 'Ballpen.js') {
                    // Use '$' to prevent from watcher's capture
                    context.$btnTitle = 'Yes, this is Ballpen.js';
                }
            }
        }
    }
});
```

## Documemnt


## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2017-present, YHSPY