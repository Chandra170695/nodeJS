const express = require("express");

const addDays = require("date-fns/addDays");

const app = express();

app.get("/", (request, response) => {
  let date = addDays(new Date(), 100);
  response.send(
    `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
  );
});

module.exports = app;
