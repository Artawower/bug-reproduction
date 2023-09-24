import { useEffect, useRef, useState } from "react";
import "./App.css";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { orgMode } from "./parser";

function App() {
  const editor = useRef();

  useEffect(() => {
    let startState = EditorState.create({
      doc: "*Hello*",
      extensions: [orgMode()],
    });

    let view = new EditorView({
      state: startState,
      parent: editor.current,
    });

    return () => {
      view.destroy();
    };
  }, []);

  return (
    <>
      <div style={{ width: "100vw", height: "100vh" }} ref={editor}></div>
    </>
  );
}

export default App;
