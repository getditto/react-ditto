import './App.css'

import { useExecuteQuery, useQuery } from '@dittolive/react-ditto'
import { useState } from 'react'

type Task = {
  _id: string
  body: string
  isCompleted: boolean
  isDeleted: boolean
}

type Props = {
  path: string
}

const App = ({ path: persistenceDirectory }: Props) => {
  const [newBodyText, setNewBodyText] = useState<string>('')
  const {
    items: tasks,
    error,
    storeObserver,
    isLoading,
  } = useQuery<Task>('select * from tasks where isDeleted = false', {
    persistenceDirectory,
  })

  const [upsert] = useExecuteQuery<void, { value: Partial<Task> }>(
    'insert into tasks documents (:value) on id conflict do update',
    {
      persistenceDirectory,
    },
  )

  const [removeByID] = useExecuteQuery<void, { id: string }>(
    'update tasks set isDeleted = true where _id = :id',
    {
      persistenceDirectory,
    },
  )

  const [setCompletedByID] = useExecuteQuery<
    void,
    Pick<Task, '_id' | 'isCompleted'>
  >('update tasks set isCompleted = :isCompleted where _id = :_id', {
    persistenceDirectory,
  })

  if (isLoading) {
    return <p>Loading...</p>
  }

  return (
    <div className="App">
      <>
        <p>
          Using Ditto with path &ldquo;{persistenceDirectory}&ldquo; and query
          &ldquo;{storeObserver?.queryString}&ldquo;
        </p>
        <span>Number of tasks {tasks?.length}</span>

        {error && <p style={{ color: 'red' }}>Error: {String(error)}</p>}
      </>

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
