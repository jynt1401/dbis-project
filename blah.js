var future = new Date(); // get today date
  future.setDate(future.getDate() + 7); // add 7 days
  var finalDate =
    future.getFullYear() +
    "-" +
    (future.getMonth() + 1 < 10 ? "0" : "") +
    (future.getMonth() + 1) +
    "-" +
    future.getDate();

var today= new Date();
var orderdate=today.getFullYear() +
"-" +
(today.getMonth() + 1 < 10 ? "0" : "") +
(today.getMonth() + 1) +
"-" +
today.getDate();
  console.log(finalDate);
  console.log(orderdate);