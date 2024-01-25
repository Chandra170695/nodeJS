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
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000);
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasPriorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

app.get("/todos/", async (request, response) => {
  let todosArray;
  const { search_q = "", status, priority } = request.query;
  let getToDosQuery;

  switch (true) {
    case hasStatusProperty(request.query):
      getToDosQuery = `
  SELECT
  *
  FROM
  todo
  WHERE
  todo LIKE '%${search_q}%'
  AND status = '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getToDosQuery = `
  SELECT
  *
  FROM
  todo
  WHERE
  todo LIKE '%${search_q}%'
  AND priority = '${priority}';`;
      break;
    case hasPriorityAndStatusProperty(request.query):
      getToDosQuery = `
  SELECT
  *
  FROM
  todo
  WHERE
  todo LIKE '%${search_q}%'
  AND status = '${status}'
  AND priority = '${priority}';`;
      break;
    default:
      getToDosQuery = `
  SELECT
  *
  FROM
  todo
  WHERE
  todo LIKE '%${search_q}%';`;
      break;
  }

  todosArray = await db.all(getToDosQuery);
  response.send(todosArray);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getToDoQuery = `SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await db.get(getToDoQuery);
  response.send(todo);
});

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const addToDoQuery = `INSERT INTO
      todo (id, todo, priority, status)
    VALUES
      (
         ${id},
        '${todo}',
        '${priority}',
        '${status}'
      );`;

  const dbResponse = await db.run(addToDoQuery);
  response.send("Todo Successfully Added");
});

const hasStatusUpdate = (requestBody) => {
  return requestBody.status !== undefined;
};

const hasPriorityUpdate = (requestBody) => {
  return requestBody.priority !== undefined;
};

app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const todoDetails = request.body;
  const { todo, priority, status } = todoDetails;
  let updateToDoQuery;
  let text;

  switch (true) {
    case hasStatusUpdate(todoDetails):
      updateToDoQuery = `UPDATE
      todo
    SET
      status='${status}'
    WHERE
      id = ${todoId};`;
      text = "Status Updated";
      break;
    case hasPriorityUpdate(todoDetails):
      updateToDoQuery = `UPDATE
      todo
    SET
      priority='${priority}'
    WHERE
      id = ${todoId};`;
      text = "Priority Updated";
      break;
    default:
      updateToDoQuery = `UPDATE
      todo
    SET
      todo='${todo}'
    WHERE
      id = ${todoId};`;
      text = "Todo Updated";
      break;
  }
  await db.run(updateToDoQuery);
  response.send(text);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deletetodoQuery = `DELETE FROM 
      todo 
    WHERE
      id = ${todoId};`;
  await db.run(deletetodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
