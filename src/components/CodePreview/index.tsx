import React, { useEffect, useRef } from 'react';
import useStyles from './styles';
import beautify_js from 'js-beautify';
import { JSXRenderer } from './utils';

const CodePreview = ({ className = '', code, format = true, preview = true }: CodePreviewProps) => {
  const classes = useStyles();
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (preview && previewRef.current) {
      const renderer = JSXRenderer(previewRef.current);
      renderer.run(code);
    }
  }, [previewRef, code, preview]);

  return (
    <div className={`${classes.codePreview} ${className}`}>
      <pre className={classes.code}>
        <code>
          {format
            ? beautify_js(code, {
                indent_size: 4,
                space_in_empty_paren: true,
                e4x: true
              })
            : code}
        </code>
      </pre>
      {preview && <div ref={previewRef} className={classes.preview}></div>}
    </div>
  );
};

export interface CodePreviewProps {
  className?: string;
  code: string;
  format?: boolean;
  preview?: boolean;
}

export default CodePreview;
