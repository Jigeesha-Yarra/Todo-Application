const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      fileName: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

// API 1
app.get("/todos/", async (request, Response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q, priority, status } = request.query;
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
        SELECT 
         * 
        FROM 
         todo 
        WHERE 
         todo LIKE '%${search_q}%' 
         AND status LIKE '${status}' 
         AND priority LIKE '${priority}';`;
      break;

    case hasPriorityProperty(request.query):
      getTodosQuery = `
        SELECT 
         * 
        FROM 
         todo 
        WHERE 
         todo LIKE '%${search_q}%'
         AND priority LIKE '${priority}';`;
      break;

    case hasStatusProperty(request.query):
      getTodosQuery = `
        SELECT 
         * 
        FROM
         todo
        WHERE 
         todo LIKE '%${search_q}%'
         AND status LIKE '${status}';`;
      break;

    default:
      getTodosQuery = `
             SELECT 
                * 
             FROM 
               todo 
             WHERE 
              todo LIKE '%${search_q}%';`;
  }
  data = await db.all(getTodosQuery);
  Response.send(data);
});

//API 2. returns a specific todo based on todoId
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT 
     *
    FROM 
     todo
    WHERE 
     id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

// API 3. Create a todo in the todo table,
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const updateTodo = `
    INSERT INTO 
       todo(id, todo, priority, status)
    VALUES
       (${id}, '${todo}', '${priority}', '${status}');`;
  await db.run(updateTodo);
  response.send("Todo Successfully Added");
});

//API 4. Updates the details of a specific todo based on the todo ID
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
    SELECT 
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
  } = request.body;

  const updateTodoQuery = `
    UPDATE 
       todo 
    SET 
       todo='${todo}',
       status='${status}', 
       priority = '${priority}' 
    WHERE 
       id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

// API 5. Deletes a todo from the todo table based on the todo ID
app.delete("/todos/:todoId/", async (request, response) => {
  const { id } = request.params;
  const deleteTodo = `
    DELETE FROM 
      todo
    WHERE 
      id = ${todoId};`;
  await db.run(deleteTodo);
  response.send("Todo Deleted");
});

module.exports = app;
