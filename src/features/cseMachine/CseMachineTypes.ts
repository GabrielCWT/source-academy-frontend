import {
  EnvTree as EnvironmentTree,
  EnvTreeNode as EnvironmentTreeNode
} from 'js-slang/dist/createContext';
import JsSlangClosure from 'js-slang/dist/interpreter/closure';
import { Environment } from 'js-slang/dist/types';
import { KonvaEventObject } from 'konva/lib/Node';
import React from 'react';

import { ArrayUnit } from './components/ArrayUnit';
import { Binding } from './components/Binding';
import { Frame } from './components/Frame';
import { Level } from './components/Level';

/** this interface defines a drawing function */
export interface Drawable {
  /** the draw logic */
  draw: (key: number) => React.ReactNode;
}

/** this interface defines a Hoverable object */
export interface IHoverable {
  onMouseEnter(e: KonvaEventObject<MouseEvent>): void;
  onMouseLeave(e: KonvaEventObject<MouseEvent>): void;
}

/** this interface defines coordinates and dimensions */
export interface IVisible extends Drawable {
  /** x coordinate of top-left corner */
  x(): number;

  /** y coordinate of top-left corner */
  y(): number;

  /** width */
  width(): number;

  /** height */
  height(): number;

  ref?: React.RefObject<any>;
}

/** unassigned is internally represented as a symbol */
export type Unassigned = symbol;

/** types of primitives in JS Slang  */
export type Primitive = number | string | boolean | null | undefined;

/** types of in-built functions in JS Slang */
export type GlobalFn = Function;

/** types of functions in JS Slang */
export type Closure = JsSlangClosure;

/** types of arrays in JS Slang */
export type DataArray = Data[] & {
  readonly id: string;
  environment: Env;
};

/** the types of data in the JS Slang context */
export type Data = Primitive | Closure | GlobalFn | Unassigned | DataArray;

/** modified `Environment` to store children and associated frame */
export type Env = Environment;

/** modified `EnvTree` */
export type EnvTree = EnvironmentTree & { root: EnvTreeNode };

/** modified `EnvTreeNode` */
export type EnvTreeNode = EnvironmentTreeNode & {
  parent: EnvTreeNode;
  children: EnvTreeNode[];
  level: Level;
  frame?: Frame;
  xCoord?: number;
};

/** empty object type  */
export type EmptyObject = {
  [K in any]: never;
};

/** types that a reference can be: either from a binding in a frame or from an array  */
export type ReferenceType = Binding | ArrayUnit;

/** type of an array of steps (as defined by a function), for the arrow classes */
export type StepsArray = Array<(x: number, y: number) => [number, number]>;
