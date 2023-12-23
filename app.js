const express = require('express')

const path = require('path')

const {open} = require('sqlite')

const sqlite3 = require('sqlite3')

const dbPath = path.join(__dirname, 'todoApplication.db')

const app = express()

app.use(express.json())

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

//Get All Todo Items

app.get('/details', async (request, response) => {
  const getData = `SELECT * FROM todo`
  const data = await db.all(getData)
  response.send(data)
})

// API 1

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let data = null

  let getTodosQuery = ''

  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'
      AND status = '${status}' AND priority = '${priority}';`
      break

    case hasPriorityProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'
      AND priority = '${priority}';`
      break

    case hasStatusProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'
      AND status = '${status}'`
      break

    default:
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'`
      break
  }

  data = await db.all(getTodosQuery)
  response.send(data)
})

// 2 GET Todo Item Based on Todo Id

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const getTodoitemQuery = `SELECT * FROM todo WHERE id = ${todoId}`

  const todoItem = await db.get(getTodoitemQuery)

  response.send(todoItem)
})

// 3 Create New Todo Item

app.post('/todos/', async (request, response) => {
  const todoBody = request.body

  const {id, todo, priority, status} = todoBody

  const createTodoItemQuery = `INSERT INTO todo(id,todo,priority,status)
  VALUES(
    '${id}',
    '${todo}',
    '${priority}',
    '${status}');`

  await db.run(createTodoItemQuery)

  response.send('Todo Successfully Added')
})

// API-4

app.put('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params

  let updateColumn = ''

  const requestBody = request.body

  const {todo, priority, status} = request.body

  switch (true) {
    case requestBody.status != undefined:
      updateColumn = 'Status'
      break

    case requestBody.priority != undefined:
      updateColumn = 'Priority'
      break

    case requestBody.todo != undefined:
      updateColumn = 'Todo'
      break
  }

  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`

  await db.get(previousTodoQuery)

  const updateTodoQuery = `UPDATE todo SET todo = '${todo}',
    priority = '${priority}',
    status = '${status}'
    WHERE id = ${todoId};`

  await db.run(updateTodoQuery)

  response.send(`${updateColumn} Updated`)
})

// 5 Delete Todo Based on Todo Id

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const deleteTodoItemQuery = `DELETE FROM todo WHERE id = ${todoId}`

  await db.run(deleteTodoItemQuery)

  response.send('Todo Deleted')
})

module.exports = app
