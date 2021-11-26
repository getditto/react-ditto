import './App.css'

import { DocumentIDValue } from '@dittolive/ditto'
import { useMutations, usePendingCursorOperation } from '@dittolive/react-ditto'
import React, { useMemo, useState } from 'react'

interface Task {
  _id?: DocumentIDValue
  body: string
  isCompleted: boolean
}

type Props = {
  path: string
}

const App: React.FC<Props> = ({ path }) => {
  const [newBodyText, setNewBodyText] = useState<string>('')
  const params = useMemo(
    () => ({
      path: path,
      collection: 'tasks',
    }),
    [path],
  )
  const { documents: tasks } = usePendingCursorOperation<Task>(params)
  const { insert, removeByID, updateByID } = useMutations<Task>({
    collection: 'tasks',
    path: path,
  })

  return (
    <div className="App">
      <p>Using Ditto with path &ldquo;{path}&ldquo;</p>
      <span>Number of tasks {tasks.length}</span>

      <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Your New Task"
          value={newBodyText}
          onChange={(e) => setNewBodyText(e.currentTarget.value)}
        />
        <button
          type="button"
          onClick={() => {
            insert({
              value: {
                body: newBodyText,
                isCompleted: false,
              },
            })
            setNewBodyText('')
          }}
        >
          Add
        </button>
      </div>
      <ul className="no-bullets">
        {tasks.map((task) => {
          return (
            <li key={task._id}>
              <p>DocumentId: {task._id}</p>
              <p>Body: {task.body}</p>
              <p>
                Is Completed: {task.isCompleted ? 'Completed' : 'Not Completed'}
              </p>
              <button
                onClick={() => {
                  removeByID({ _id: task._id })
                }}
              >
                Remove
              </button>
              <button
                onClick={() => {
                  updateByID({
                    _id: task._id,
                    updateClosure: (mutableDoc) => {
                      if (mutableDoc) {
                        mutableDoc.isCompleted = !mutableDoc.isCompleted
                      }
                    },
                  })
                }}
              >
                Toggle
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default App
