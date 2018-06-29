gjallarhorn.js
==============================================================================

Inspired by [heimdalljs](https://github.com/heimdalljs/heimdalljs-lib), which is a very interesting approach to performance measurement that unfortunately appears to be blocked at the moment.

Trees of timers. Timer trees. A timer forest?

Create timers in your code:

```js
load: task(function*() {
  let timer = new Timer('service:state:load');
  timer.start();
  yield timeout(75);

  let foo = timer.startChild('foo');
  yield timeout(100);

  let bar = foo.startChild('bar');

  bar.startChild('baz');
  yield timeout(50);
  bar.stopChild('baz');

  bar.startChild('baq')
  yield timeout(150);

  timer.stop(); // Stop this timer and all children

  console.log(JSON.stringify(timer.toJSON()));
})
```

Get JSON output:
```JSON
{
  "name": "service:state:load",
  "duration": 384.50000000012,
  "children": [
    {
      "name": "service:state:load:foo",
      "duration": 305.39999999746,
      "children": [
        {
          "name": "service:state:load:foo:bar",
          "duration": 204.79999999952,
          "children": [
            {
              "name": "service:state:load:foo:bar:baz",
              "duration": 54.000000003725
            },
            {
              "name": "service:state:load:foo:bar:baq",
              "duration": 150.69999999832
            }
          ]
        }
      ]
    }
  ]
}
```

Installation
------------------------------------------------------------------------------

TODO

Usage
------------------------------------------------------------------------------

[Longer description of how to use the addon in apps.]


Contributing
------------------------------------------------------------------------------

### Installation

* `git clone <repository-url>`
* `cd gjallarhornjs`
* `yarn install`

License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
