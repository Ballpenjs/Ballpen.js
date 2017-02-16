# Ballpen.js
A tiny MVVM framework ready for building flexible web apps.

## How to install?

## How to use?

```css
<!-- html -->
.todo-style {
    color: red;
    font-weight: bold;
}
```

```html
<!-- html -->
<div id="app">
  <h1 bp-model="bundle.title" bp-show="see"></h1>
  <input type="text" bp-model="bundle.title" bp-event:input="syncTitle">
  <button bp-event:click="foldTitle">Toggle Title</button>
  <br/>
  <ul>
    <li bp-for="todoList" bp-class="todoStyle" bp-show="@.show">
        <!-- Get the 'for' circulation index by @{index}, '@' means current 'bp-for' context, '{}' means current circulation's inner attribute -->
        <h2 bp-model="@{index}"></h2>
        <!-- Get corresponding attributes -->
        <p bp-model="@.title"></p>
        <p bp-model="@.content"></p>
        <!-- Set an event handler within this circulation scope with '@:' -->
        <button bp-event:click="@:doneTodoItem">- Done -</button>
    </li>
  </ul>
  <!-- Bind custimized labels with 'bp-bind' -->
  <button bp-bind:name="name" bp-event:click="reverseName" bp-model="name"></button>
</div>
```

```javascript
// javascript
let data = {
    see: true,
    bundle: {
        title: "It's a sunny day!"
    },
    todoList: [
        {
            title: "Health",
            content: "Get up earlier!",
            show: true
        },
        {
            title: "Health",
            content: "Never stay up too late!",
            show: true
        },
        {
            title: "Emotion",
            content: "Happy everyday!",
            show: false
        }
    ],
    todoStyle: "todo-style",
    name: "YHSPY - Ballpen.js"
};

new Ballpen("#app", {
    data: data,
    event: {
        foldTitle: (el, context) => {
            // Global context => data
            context.see = !context.see;
        },
        syncTitle: (el, context) => {
            // Global context => data
            context.bundle.title = el.value; // 'el' is the dom element you bind with this method;
        },
        doneTodoItem: (el, context) => {
            // 'bp-for' context => data.todoList
            context.show = false;
        },
        reverseName: (el, context) => {
            context.name = context.name.split('').reverse().join('');
        }
    }
});
```