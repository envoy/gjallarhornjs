import Timer from '../src/index';

describe('the Timer class', () => {
  let timer = new Timer('testing123');
  timer.start();
  timer.stop();

  it('sets the correct labels', () => {
    expect(timer.startLabel).toEqual('testing123-start');
    expect(timer.stopLabel).toEqual('testing123-stop');
  });
});

describe('Timer.append', () => {
  let foo = new Timer('foo');
  let bar = new Timer('bar');
  let baz = new Timer('baz');

  foo.start();

  foo.append(bar);

  test('has children after append', () => {
    expect(foo.hasChildren).toBeTruthy();
    expect(foo.children.length).toEqual(1);
  });

  test("foo's child should be a Timer", () => {
    expect(foo.children[0]).toBeInstanceOf(Timer);
  });

  describe('appending to a child', () => {
    bar.start();
    bar.stop();
    bar.append(baz);

    test('should register on the parent', () => {
      expect(foo.children[0].hasChildren).toBeTruthy();
    });

    test("should NOT affect the parent's child count", () => {
      expect(foo.children.length).toEqual(1);
    });
  });
});

describe('Timer.{startChild, stopChild}', () => {
  let foo: Timer;
  let bar: Timer;

  beforeEach(() => {
    foo = new Timer('foo');
    foo.start();
    bar = foo.startChild('bar');
  });

  test('foo should have children after append', () => {
    expect(foo.hasChildren).toBeTruthy();
    expect(foo.children.length).toEqual(1);
  });

  test("foo's child should be a Timer", () => {
    expect(foo.children[0]).toBeInstanceOf(Timer);
  });

  test("bar's label should indicate its lineage", () => {
    expect(bar.label).toEqual('foo:bar');
  });

  test('stopping foo should stop all children', () => {
    expect(foo.stopLabel).toBeFalsy();
    expect(bar.stopLabel).toBeFalsy();

    foo.stop();

    expect(foo.stopLabel).toEqual('foo-stop');
    expect(bar.stopLabel).toEqual('foo:bar-stop');
  });

  test('calling `stopChild` should stop the child without stopping the parent', () => {
    expect(foo.stopLabel).toBeFalsy();
    expect(bar.stopLabel).toBeFalsy();

    foo.stopChild('bar');

    expect(foo.stopLabel).toBeFalsy();
    expect(bar.stopLabel).toEqual('foo:bar-stop');
  });
});
