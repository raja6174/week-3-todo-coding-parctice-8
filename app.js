const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
app.use(express.json());

let db = null;
const filePath = path.join(__dirname, "todoApplication.db");
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: filePath,
      driver: sqlite3.Database,
    });
    app.listen(3000);
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

//API 1
app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status } = request.query;
  let data = null;
  let getTodoQuery = "";

  switch (true) {
    case hasPriorityAndStatus(request.query):
      getTodoQuery = `
                SELECT * FROM 
                todo
                WHERE todo LIKE '%${search_q}%' AND 
                status = '${status}' AND
                priority = '${priority}'
            `;
      break;

    case hasStatus(request.query):
      getTodoQuery = `
                SELECT * FROM 
                todo
                WHERE todo LIKE '%${search_q}%' AND 
                status = '${status}';
            `;
      break;
    case hasPriority(request.query):
      getTodoQuery = `
                SELECT * FROM 
                todo
                WHERE todo LIKE '%${search_q}%' AND 
                priority = '${priority}';
            `;
      break;

    default:
      getTodoQuery = `
                SELECT * FROM 
                todo
                WHERE todo LIKE '%${search_q}%';
            `;
      break;
  }

  data = await db.all(getTodoQuery);
  response.send(data);
});

//API 2
app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT 
        * FROM 
        todo
        WHERE 
        id = ${todoId};
    `;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

//API 3
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const addTodoQuery = `
    INSERT INTO 
    todo(id, todo, priority, status)
    VALUES (
        ${id},
        '${todo}',
        '${priority}',
        '${status}'
    );
    `;

  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

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

  const getCurrentTodo = `
  SELECT 
  * 
  FROM 
  todo
  WHERE id = ${todoId};
  `;

  const currentTodo = await db.get(getCurrentTodo);

  const {
    todo = currentTodo.todo,
    status = currentTodo.status,
    priority = currentTodo.priority,
  } = request.body;

  const updateQuery = `
   UPDATE todo
   SET 
    todo = '${todo}',
    status = '${status}',
    priority = '${priority}'
  WHERE 
   id = ${todoId};
  `;

  await db.run(updateQuery);
  response.send(`${updateColumn} Updated`);
});

//API 5

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
DELETE FROM todo
WHERE id = ${todoId};
`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
