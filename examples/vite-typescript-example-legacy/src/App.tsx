import './App.css'

import { useMutations, usePendingCursorOperation } from '@dittolive/react-ditto'
import { useMemo, useState } from 'react'

type Props = {
  path: string
}

const App = ({ path }: Props) => {
  const [newBodyText, setNewBodyText] = useState<string>('')
  const params = useMemo(
    () => ({
      path: path,
      collection: 'tasks',
    }),
    [path],
  )
  const { documents: tasks } = usePendingCursorOperation(params)
  const { upsert, removeByID, updateByID } = useMutations({
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
            upsert({
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
            <li key={task.id.value}>
              <p>DocumentId: {task.id.value}</p>
              <p>Body: {task.value.body}</p>
              <p>
                Is Completed:{' '}
                {task.value.isCompleted ? 'Completed' : 'Not Completed'}
              </p>
              <button
                onClick={() => {
                  removeByID({ _id: task.id })
                }}
              >
                Remove
              </button>
              <button
                onClick={() => {
                  updateByID({
                    _id: task.id,
                    updateClosure: (mutableDoc) => {
                      mutableDoc
                        .at('isCompleted')
                        .set(!mutableDoc.value.isCompleted)
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
