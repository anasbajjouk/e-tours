const express = require('express');

const app = express();

app.get('/', (request, response) => {
  response
    .status(200)
    .json({ message: 'Hello from the server side!', app: 'Natours' });
});

app.post('/', (request, response) => {
  response.send('Im called POST');
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`App running on port ${PORT}....`);
});
