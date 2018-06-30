# gjallarhorn.js

Trees of timers. Timer trees. A timer forest?

## Just show me an example

Create timers in your code:

```js
import { Timer } from 'gjallarhornjs';

fetchData = async () => {
  let timer = new Timer('fetchData');
  timer.start();

  let requestTimer = timer.startChild('request');
  requestTimer.startChild('fetch');

  let response = await fetch(`https://api.github.com/users/${this.state.inputValue}`);

  requestTimer.stopChild('fetch');

  requestTimer.startChild('json');
  let json = await response.json();
  requestTimer.stop();

  timer.startChild('setState');

  this.setState({
    github: json,
  });

  timer.stop();

  console.log(JSON.stringify(timer.toJSON()));

  timer.clear();
};
```

Get JSON output:

```JSON
{
  "name": "fetchData",
  "duration": 224.00000000016007,
  "children": [
    {
      "name": "fetchData:request",
      "duration": 223.79999999975553,
      "children": [
        {
          "name": "fetchData:request:fetch",
          "duration": 223.5000000000582
        },
        {
          "name": "fetchData:request:json",
          "duration": 0.19999999858555384
        }
      ]
    },
    {
      "name": "fetchData:setState",
      "duration": 0.10000000111176632
    }
  ]
}
```

## Ok, nevermind, I want an explanation

Inspired by [heimdalljs](https://github.com/heimdalljs/heimdalljs-lib), gjallarhorn.js is a library for timing things using trees. In its most basic form, gjallarhorn is just an abstraction over the built-in [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance). However, in many cases when you're timing a chunk of code, you're not JUST interested in how long that code takes to execute, you're also interested in how long certain pieces of the code take to execute. More specifically, you probably know enough about the code you're testing that you don't see it as on big function, but rather a group of discrete steps, some of which may be dependent on other steps.

This is where the the trees come in!

Let's look at an example. Say you've got a function that makes an API request, and you're curious about what's taking it so long;

```js
fetchData = async () => {
  let response = await fetch(`https://api.github.com/users/${this.state.inputValue}`);
  let json = await response.json();

  this.setState({
    github: json,
    time: timer.value.duration,
  });
};
```

The first step would be to simply time the function from beginning to end:

```js
import { Timer } from 'gjallarhornjs';

fetchData = async () => {
  let timer = new Timer('fetchData');
  timer.start();

  let response = await fetch(`https://api.github.com/users/${this.state.inputValue}`);
  let json = await response.json();

  this.setState({
    github: json,
  });

  timer.stop();

  console.log(JSON.stringify(timer.toJSON()));

  timer.clear();
};
```

In this basic case, we'd get a simple JSON representation of single node in our Timer tree:

```js
{
  "name": "fetchData",
  "duration": 230.7000000002081
}
```

But let's say that's not enough information. We want to know where the time is being spent, so let's measure things in a bit more detail. More specifically, we want to measure the `fetch` request and the `setState` call, and even more than that, we want to time the `fetch` itself as well as the call to `.json()`. In other words, we see the key points of this function's execution as the following tree:

```
fetchData
  ├── request
  │   ├── fetch
  │   └── json
  └── setState
```

This is the _most basic form_ of how we'd do this. **Note: if this looks painfully verbose to you, read on. Abstractions incoming.**

```js
fetchData = async () => {
  let timer = new Timer('fetchData');
  timer.start();

  let requestTimer = new Timer('fetchData:request');
  timer.append(requestTimer);
  let fetchTimer = new Timer('fetchData:request:fetch');
  requestTimer.append(fetchTimer);

  requestTimer.start();
  fetchTimer.start();

  let response = await fetch(`https://api.github.com/users/${this.state.inputValue}`);

  fetchTimer.stop();

  let jsonTimer = new Timer('fetchData:request:json');
  requestTimer.append(jsonTimer);
  jsonTimer.start();
  let json = await response.json();
  jsonTimer.stop();
  requestTimer.stop();

  let setStateTimer = new Timer('fetchData:setState');
  timer.append(setStateTimer);
  setStateTimer.start();

  this.setState({
    github: json,
  });

  setStateTimer.stop();
  timer.stop();

  console.log(JSON.stringify(timer.toJSON()));

  timer.clear();
};
```

When all of the above is said and done, we'll get an output that looks like this:

```json
{
  "name": "fetchData",
  "duration": 224.00000000016007,
  "children": [
    {
      "name": "fetchData:request",
      "duration": 223.79999999975553,
      "children": [
        {
          "name": "fetchData:request:fetch",
          "duration": 223.5000000000582
        },
        {
          "name": "fetchData:request:json",
          "duration": 0.19999999858555384
        }
      ]
    },
    {
      "name": "fetchData:setState",
      "duration": 0.10000000111176632
    }
  ]
}
```

Cool, right? The only problem is that the code we had to write to get this output was so tedious. Having to manually construct, start, and append each node to its parent, while also making sure to give them labels so we can see each node's ancestry was a pain. Luckily, Gjallarhorn has you covered. Rather than using the `Timer` constructo along with `append` and `start` for every single timer, we can instead use the built-in `startChild` method. `startChild` will construct a new timer, append to the parent, create a new label that includes the ancestry information, and start the timer for you.

Here's what the simpler version looks like:

```js
fetchData = async () => {
  // create and start root timer
  let timer = new Timer('fetchData');
  timer.start();

  // create and start the 'request' timer, and then call its `startChild` method to do the same for
  // the `fetch` timer
  let requestTimer = timer.startChild('request');
  requestTimer.startChild('fetch');

  let response = await fetch(`https://api.github.com/users/${this.state.inputValue}`);

  // Use Timer's `stopChild` method to halt our `fetch` timer while the `requestTimer` keeps running
  requestTimer.stopChild('fetch');

  requestTimer.startChild('json');
  let json = await response.json();
  // Stop the request timer. Notice how we never called `requestTimer.stopChild('json')`.
  // This is because calling `stop` on any time will automatically stop all of its still-running children.
  requestTimer.stop();

  timer.startChild('setState');

  this.setState({
    github: json,
  });

  // Again, now that we know we're done, we call `timer.stop()` knowing that it will also stop any
  // still-running child timers as well
  timer.stop();

  console.log(JSON.stringify(timer.toJSON()));

  timer.clear();
};
```

This version will give the exact same output as the previous timer code, but it takes a lot less work to get there. Here are the highlights:

- Every instance of `Timer` has a `startChild` and `stopChild` method, both of which take a string as their only argument. Use this to label what your timer is timing.
- `startChild` will automatically take the label you provide and concatenate it with its parent timers using a `:`, so you don't have to worry about including parent information in child labels, `startChild` does it for you.
- `startChild` will return the **child** timer that it creates, which you can use to get more fine-grained control over the child timer. In the example above, we use it to create more deeply-nested children.
- Calling `stop` on any `Timer` instance will stop it *as well as all of its still-running children*. This is handy if you have a lot of nested timers and want to just clean everything up at the end.
- All `Timer` instances have a `toJSON` method that will give you a JSON representation of the Timer tree you've created, using itself as the root.
- All `Timer` instances have a `clear` method which will wipe away all the performance measures and marks. Usually you want to use this right before the code you're timing finishes executing (but make sure you do this *after* you've used the timing data!)

## Installation

`yarn add gjallarhornjs`

## Usage
```js
import { Timer } from 'gjallarhornjs';

let timer = new Timer('thisIsATimer');
timer.start();

// ...do stuff...

timer.stop();

let data = timer.value;

timer.clear();
```

## Contributing

### Installation

- `git clone <repository-url>`
- `cd gjallarhornjs`
- `yarn install`

## License

This project is licensed under the [MIT License](LICENSE.md).
