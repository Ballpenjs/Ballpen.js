module.exports = {
  'bp-class': function (browser) {
    browser
    .url('http://localhost:8080/examples/bp-class.html')
      .waitForElementVisible('#app', 1000)
      .assert.containsText('#app .bp-class-name', 'Ballpen.js')
      .assert.containsText('#app .bp-class-version', '1.0')

      .assert.attributeContains('#app .bp-class-name', 'class', 's-name')
      .assert.attributeContains('#app .bp-class-version', 'class', 's-version')

      .end();
  }
};
