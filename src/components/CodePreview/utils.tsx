import React from 'react';
import ReactDOM from 'react-dom';
import * as Acorn from 'acorn';
import { transform as babelTransform } from '@babel/standalone';
import { generate as generateJs } from 'escodegen';
import ObjPath from 'object-path';

const isReactNode = (node: Acorn.Node) => {
  const type = node.type;
  const obj = ObjPath.get(node, 'expression.callee.object.name');
  const func = ObjPath.get(node, 'expression.callee.property.name');
  return type === 'ExpressionStatement' && obj === 'React' && func === 'createElement';
};

const findReactNode = ({ body }: AcornBodyNode) => body.find(isReactNode);

export const JSXRenderer = (domElement: HTMLDivElement, require = () => null) => {
  const render = (node: React.ReactElement) => {
    ReactDOM.render(node, domElement);
  };

  const getWrapperFunction = (code: string) => {
    try {
      const transpiled = babelTransform(code, { presets: ['es2015', 'react'] }).code;
      const acornNode = Acorn.parse(transpiled, {
        sourceType: 'module',
        ecmaVersion: 'latest'
      }) as AcornBodyNode;
      const reactNode = findReactNode(acornNode);

      if (reactNode) {
        const nodeIndex = acornNode.body.indexOf(reactNode);
        const createElSrc = generateJs(reactNode).slice(0, -1);
        const renderCallAst = (
          Acorn.parse(`render(${createElSrc})`, { ecmaVersion: 'latest' }) as AcornBodyNode
        ).body[0];
        acornNode.body[nodeIndex] = renderCallAst;
      }
      return new Function('React', 'render', 'require', generateJs(acornNode));
    } catch (e: unknown) {
      if (e instanceof Error) {
        render(<pre>{e.message}</pre>);
      } else {
        console.error(e);
      }
    }
  };

  return {
    run(code: string) {
      getWrapperFunction(code)?.(React, render, require);
    }
  };
};

export interface AcornBodyNode extends Acorn.Node {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: [Node | any]; // see https://github.com/acornjs/acorn/issues/741
}

export interface JSXRendererProps {
  run: (code: string) => void;
}
