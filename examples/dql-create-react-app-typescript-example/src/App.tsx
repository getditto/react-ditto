import './App.css'

import { useMutations, useQuery } from '@dittolive/react-ditto'
import React, { useState } from 'react'

const styles: Record<string, React.CSSProperties> = {
  app: {
    maxWidth: '600px',
    margin: '3em auto',
    textAlign: 'left',
  },
  error: {
    color: 'red',
  },
  header: {
    backgroundColor: '#f5f5f5',
    padding: '1em',
  },
}

type Props = {
  path: string
}

const App: React.FC<Props> = ({ path }) => {
  const [newBodyText, setNewBodyText] = useState<string>('')
  const {
    items: tasks,
    error,
    storeObserver,
    isLoading,
  } = useQuery('select * from tasks')
  const { upsert, removeByID, updateByID } = useMutations({
    collection: 'tasks',
    path: path,
  })

  if (isLoading) {
    return <p>Loading...</p>
  }

  return (
    <div className="App" style={styles.app}>
      <div className="header" style={styles.header}>
        <p>
          Using Ditto with path &ldquo;{path}&ldquo; and query &ldquo;
          {storeObserver.queryString}&ldquo;
        </p>
        <span>Number of tasks {tasks?.length}</span>

        {error && <p style={styles.error}>Error: {error.message}</p>}

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
      </div>
      <ul className="no-bullets">
        {tasks.map((task) => {
          return (
            <li key={task.value._id}>
              <p>DocumentId: {task.value._id}</p>
              <p>Body: {task.value.body}</p>
              <p>
                Is Completed:{' '}
                {task.value.isCompleted ? 'Completed' : 'Not Completed'}
              </p>
              <button
                onClick={() => {
                  removeByID({ _id: task.value._id })
                }}
              >
                Remove
              </button>
              <button
                onClick={() => {
                  updateByID({
                    _id: task.value._id,
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
