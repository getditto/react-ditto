import './App.css'

import { useExecuteQuery, useQuery } from '@dittolive/react-ditto'
import React, { useState } from 'react'

type Task = {
  _id: string
  body: string
  isCompleted: boolean
  isDeleted: boolean
}

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

function isError(error: unknown): error is Error {
  return error instanceof Error
}

const App: React.FC<Props> = ({ path: persistenceDirectory }) => {
  const [newBodyText, setNewBodyText] = useState<string>('')
  const {
    items: tasks,
    error,
    storeObserver,
    isLoading,
  } = useQuery<Task>('select * from tasks where isDeleted = false', {
    queryArguments: { val: false },
    persistenceDirectory,
  })

  const [upsert] = useExecuteQuery<unknown, { value: Partial<Task> }>(
    'insert into tasks documents (:value) on id conflict do update',
    {
      queryArguments: { value: { isDeleted: false } },
      persistenceDirectory,
    },
  )

  const [removeByID] = useExecuteQuery<unknown, { id: string }>(
    'update tasks set isDeleted = true where _id = :id',
    {
      persistenceDirectory,
    },
  )

  const [setCompletedByID] = useExecuteQuery<
    unknown,
    Pick<Task, '_id' | 'isCompleted'>
  >('update tasks set isCompleted = :isCompleted where _id = :_id', {
    persistenceDirectory,
  })

  if (isLoading) {
    return <p>Loading...</p>
  }

  return (
    <div className="App" style={styles.app}>
      <div className="header" style={styles.header}>
        <p>
          Using Ditto with persistence directory &ldquo;{persistenceDirectory}
          &ldquo; and query &ldquo;
          {storeObserver.queryString}&ldquo;
        </p>
        <span>Number of tasks {tasks?.length}</span>

        {isError(error) && <p style={styles.error}>Error: {error.message}</p>}

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
                  isDeleted: false,
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
                  removeByID({ id: task.value._id })
                }}
              >
                Remove
              </button>
              <button
                onClick={() => {
                  setCompletedByID({
                    _id: task.value._id,
                    isCompleted: !task.value.isCompleted,
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
