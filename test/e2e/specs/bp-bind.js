module.exports = {
  'bp-bind': function (browser) {
    browser
    .url('http://localhost:8080/examples/bp-bind.html')
      .waitForElementVisible('#app', 1000)
      .assert.containsText('#app .bp-bind-name', 'Ballpen.js')
      .assert.containsText('#app .bp-bind-version', '1.0')

      .assert.attributeContains('#app .bp-bind-name', 'name', 'Ballpen.js')
      .assert.attributeContains('#app .bp-bind-version', 'data-version', '1.0')
      .assert.attributeContains('#app .bp-bind-multi', 'multi-bind-version', 'attr.1.0')
      .assert.attributeContains('#app .bp-bind-multi', 'multi-bind-name', 'attr.ballpen.js')

      .end()
  }
}