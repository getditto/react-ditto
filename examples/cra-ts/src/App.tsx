import React, { ReactElement, useState } from "react";
import { usePendingCursorOperation } from "@dittolive/react-ditto";
import { DocumentID } from "@dittolive/ditto";

interface Task {
  _id: DocumentID;
  body: string;
  isCompleted: boolean;
}

export default function App(): ReactElement {
  const [newTaskInput, setNewTaskInput] = useState("");

  const { documents, ditto } = usePendingCursorOperation<Task>({
    collection: 'tasks'
  })

  const submit = () => {
    if (newTaskInput.length === 0) {
      alert("Please write something!");
      return;
    }
    ditto.store.collection("tasks").insert({
      value: {
        body: newTaskInput,
        isCompleted: false,
      },
    });
    setNewTaskInput("");
  };

  const removeById = (_id: any) => {
    ditto.store.collection("tasks").findByID(_id).remove();
  };

  const setIsCompleted = (_id: any, isCompleted: boolean) => {
    ditto.store
      .collection("tasks")
      .findByID(_id)
      .update((mutableDoc: any) => {
        mutableDoc.isCompleted = isCompleted;
      });
  };

  const updateTaskBody = (_id: any, body: string) => {
    ditto.store
      .collection("tasks")
      .findByID(_id)
      .update((mutableDoc: any) => {
        mutableDoc.body = body;
        console.log(mutableDoc.body)
      });
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-12 col-lg-8 pt-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className="input-group mb-3">
              <input
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                type="text"
                className="form-control"
                placeholder="Enter your new task here"
              />
              <button className="btn btn-outline-secondary" type="submit">
                Add task
              </button>
            </div>
          </form>

          {documents.map((doc) => (
            <div key={doc._id.value} className="input-group mb-3">
              <div className="input-group-text">
                <input
                  className="form-check-input mt-0"
                  type="checkbox"
                  checked={doc.isCompleted}
                  onChange={() => {
                    setIsCompleted(doc._id, !doc.isCompleted);
                  }}
                />
              </div>
              <input
                type="text"
                className="form-control"
                value={doc.body}
                onChange={(e) => {
                  updateTaskBody(doc._id, e.currentTarget.value);
                }}
              />
              <button
                className="btn btn-outline-secondary"
                onClick={() => removeById(doc._id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
