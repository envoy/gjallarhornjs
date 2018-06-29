export interface Node {
  value: any;
  children: Array<Node>;

  isRoot: boolean;
  hasChildren: boolean;

  append(child: Node): Node;
}

export interface TimerJSON {
  name: string;
  duration: number;
  children?: Array<TimerJSON>
}

export type PerformanceSubset = Pick<
  Performance,
  'mark' |
  'measure' |
  'getEntriesByName' |
  'clearMarks' |
  'clearMeasures'
>;
