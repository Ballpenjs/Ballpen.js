# Ballpen.js
A tiny mvvm framework ready for building flexible web apps.

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
    <li bp-for="todo" bp-class="todoStyle">
        <h2 bp-for-model="@{index}"></h2>
        <p bp-for-model="@.title"></p>
        <p bp-for-model="@.content"></p>
        <p bp-for-model="@.done"></p>
    </li>
  </ul>
</div>
```

```javascript
// javascript
ballpen = new Ballpen("#app", {
    data: {
        see: true,
        bundle: {
            title: "It's a sunny day!"
        },
        todo: [
            {
                title: "Health",
                content: "Get up earlier!",
                done: true
            },
            {
                title: "Health",
                content: "Never stay up too late!",
                done: false
            },
            {
                title: "Emotion",
                content: "Happy everyday!",
                done: false
            }
        ],
        todoStyle: "todo-style"
    },
    event: {
        foldTitle: function(el) {
            this.see = !this.see;
        },
        syncTitle: function(el) {
            this.bundle.title = el.value;
        }
    }
});
```