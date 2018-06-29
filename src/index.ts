import { TimerJSON, PerformanceSubset } from './types';
import { performance } from './performance';

export class Timer {
  private _children: Array<Timer> = [];
  private _parent: Timer | null = null;
  private performance: PerformanceSubset;

  startLabel = '';
  stopLabel = '';

  constructor(public label: string) {
    this.performance = performance();
  }

  get value() {
    this.performance.measure(this.label, this.startLabel, this.stopLabel);
    let measures: Array<PerformanceMeasure> = this.performance.getEntriesByName(this.label);
    return measures[0];
  }

  get isRoot() {
    return !this._parent;
  }

  get children() {
    return this._children;
  }

  get hasChildren() {
    return this._children.length > 0;
  }

  start() {
    this.startLabel = `${this.label}-start`;
    this.performance.mark(this.startLabel);
  }

  stop() {
    if (!this.stopLabel) {
      this.stopLabel = `${this.label}-stop`;
      this.performance.mark(this.stopLabel);
    }

    if (this.hasChildren) {
      this.children.forEach(child => {
        child.stop();
      });
    }
  }

  startChild(label: string): Timer {
    let child = new Timer(`${this.label}:${label}`);
    child._parent = this;
    this._children.push(child);
    child.start();
    return child;
  }

  stopChild(label: string): Timer {
    let child = this._children.find(child => child.label === `${this.label}:${label}`);

    if (child) {
      child.stop();
    }
    return this;
  }

  append(child: Timer): Timer {
    child._parent = this;
    this._children.push(child);
    return this;
  }

  clear() {
    this.performance.clearMarks(this.startLabel);
    this.performance.clearMarks(this.stopLabel);
    this.performance.clearMeasures(this.label);

    if (this.hasChildren) {
      this.children.forEach(child => {
        child.clear();
      });
    }
  }

  toJSON() {
    let json: TimerJSON = Object.assign(
      {},
      {
        name: this.label,
        duration: this.value.duration,
      }
    );

    if (this.hasChildren) {
      json.children = this.children.map(child => child.toJSON());
    }

    return json;
  }
}

export default Timer;
