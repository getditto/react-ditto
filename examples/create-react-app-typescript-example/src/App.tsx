import React, { useState } from "react";
import "./App.css";
import {
  useDitto,
  useMutations,
  usePendingCursorOperation,
} from "@dittolive/react-ditto";
import { DocumentID } from "@dittolive/ditto";

interface Task {
  _id?: DocumentID;
  body: string;
  isCompleted: boolean;
}

function App() {
  const [newBodyText, setNewBodyText] = useState<string>("");
  const { ditto } = useDitto("/foo");
  const { documents: tasks } = usePendingCursorOperation<Task>({
    path: "/foo",
    collection: "tasks",
  });
  const { insert, removeByID, updateByID } = useMutations<Task>({ path: "/foo" });

  return (
    <div className="App">
      <p>Using Ditto with path "{ditto?.path}"</p>
      <span>Number of tasks {tasks.length}</span>

      <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Your New Task"
          value={newBodyText}
          onChange={(e) => setNewBodyText(e.currentTarget.value)}
        />
        <button
          type="button"
          onClick={() => {
            insert("tasks", {
              body: newBodyText,
              isCompleted: false,
            });
            setNewBodyText("");
          }}
        >
          Add
        </button>
      </div>
      <ul className="no-bullets">
        {tasks.map((task) => {
          return (
            <li key={task._id?.value}>
              <p>DocumentId: {task._id?.value}</p>
              <p>Body: {task.body}</p>
              <p>Is Completed: {task.isCompleted ? "Completed": "Not Completed"}</p>
              <button onClick={() => {
                removeByID(store => store.collection('tasks').findByID(task._id))
              }}>Remove</button>
              <button onClick={() => {
                updateByID((store) => store.collection('tasks').findByID(task._id), (mutableDoc) => {
                  if (mutableDoc) {
                    mutableDoc.isCompleted = !mutableDoc.isCompleted
                  }
                })
              }}>Toggle</button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default App;
