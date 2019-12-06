const Excel = require('exceljs');
const axios = require('axios');
const fs = require('fs');
const querystring = require('querystring');
const uniqueRandom = require('unique-random');
const config = require('./config');
var workbook = new Excel.Workbook();
var cron = require('node-cron');

var spyd_access_token = "";

writelog("Service Started");

//cron.schedule('0 0 0 * * *', () => {
  writelog("-------------------------------------CRON job started------------------------------------");
  startProcess();
//});

function startProcess() {
  writelog("Fetching SPYD token");
  axios.post(config.SPYD_AUTH_API, config.SPYD_AUTH_API_BODY, { headers: { 'Content-Type': 'application/json' } }).then((tokenResult) => {
    spyd_access_token = tokenResult.data.results.access_token;

    writelog("SPYD token fetched");
    uploadQuestions();
  }).catch(err => {
    writelog("Error when fetching token");
    writelog(err);
  });
}

function imageExists(image_url) {
  var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
  var http = new XMLHttpRequest();

  http.open('HEAD', image_url, false);
  http.send();

  return http.status != 404;
}

function LoadWorkbookRows(empArray, worksheet, indexes, lookupArray) {
  empArray.sort((a, b) => (a.attributes["employee-code"] > b.attributes["employee-code"]) ? 1 : -1)
  var index = indexes.index;
  var rowIndex = indexes.rowIndex;
  var options = ["A", "B", "C", "D"];

  for (let emp of empArray) {

    var row = worksheet.getRow(index + 1);
    var names = getUniqueNames(emp.attributes["full-name"], lookupArray);
    var randomSequence = getRandomSequence(1, 4);

    row.getCell(1).value = config.QUESTION_TEXT; // Question Text
    row.getCell(2).value = config.QUESTION_TYPE; // Type
    row.getCell(3).value = 1; // Level
    row.getCell(4).value = 0; // IsBonus
    row.getCell(5).value = 15; // Duration
    row.getCell(6).value = emp.attributes["profile-picture"]; // URL
    row.getCell(7).value = names[randomSequence[0] - 1]; // Option A
    row.getCell(8).value = names[randomSequence[1] - 1]; // Option B
    row.getCell(9).value = names[randomSequence[2] - 1]; // Option C
    row.getCell(10).value = names[randomSequence[3] - 1]; // Option d
    row.getCell(11).value = options[randomSequence.indexOf(1)]; // Correct Answer

    row.commit();

    index++;
  }

  return { "index": index, "rowIndex": rowIndex };
}


async function uploadQuestions() {
  writelog("Fetching cogs token");
  axios.post(config.COGS_LOGIN_API, querystring.stringify(config.COGS_CREDENTIALS), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
    .then((result) => {
      var token = result.data.data.attributes["access-token"];

      writelog("Cogs token fetched");
      writelog("Fetching employees data from cogs");

      axios({
        method: 'get',
        url: config.COGS_GET_EMPLOYEESDATA_API,
        headers: { 'Authorization': "Bearer " + token }
      }).then(async function (result) {

        writelog("Employees data fetched from cogs. Count: " + result.data.data.length);

        var cogs_Data = result.data.data;
        var insertArray = [];

        writelog("Fetching SPYD Questions");

        var questions = await axios({
          method: 'get',
          url: config.SPYD_GET_QUESTIONS_API,
          headers: { 'x-access-token': spyd_access_token }
        });

        var empDataSet = questions.data.results;

        if (empDataSet.length > 0) {

          writelog("SPYD Questions fetched. Count: " + empDataSet.length);

          // cogs_Data.forEach(emp => {

          //   if (emp.attributes["profile-picture"] != null) {
          //     var data = empDataSet.filter(x => emp.attributes["profile-picture"] != null && emp.attributes["profile-picture"].toString().replace(":443", "") == x.url.toString().replace(":443", ""))

          //     if (data.length < 1) {
          //       if (imageExists(emp.attributes["profile-picture"])) {
          //         insertArray.push(emp);
          //       }
          //       else {
          //         writelog("Image (" + emp.attributes["profile-picture"] + ") not found for " + emp.attributes["full-name"]);
          //       }
          //     }
          //   } else {
          //     writelog("Image (" + emp.attributes["profile-picture"] + ") not found for " + emp.attributes["full-name"]);
          //   }
          // })

          for (var i = 0; i < empDataSet.length; i++) {
            var data = cogs_Data.filter(x => x.attributes["profile-picture"] != null && x.attributes["profile-picture"] == empDataSet[i].url);

            //if (data.length < 1) 
            {
              writelog("Deleting Question " + JSON.stringify(empDataSet[i].options));
              writelog("Deleting question: " + empDataSet[i].question_id);
              var response = await axios({
                method: 'delete',
                url: config.SPYD_DELETE_QUESTION_API + empDataSet[i].question_id,
                headers: { 'x-access-token': spyd_access_token }
              });

              writelog(response.data.results);
            }
          }
        }
        else {
          writelog("No questions found on quiz");

          cogs_Data.forEach(emp => {
            if (emp.attributes["profile-picture"] != null && imageExists(emp.attributes["profile-picture"])) {
              insertArray.push(emp);
            }
            else {
              writelog("Image (" + emp.attributes["profile-picture"] + ") not found for " + emp.attributes["full-name"]);
            }
          })
        }

        workbook.xlsx.readFile(config.TEMPLATE_FILENAME)
          .then(function () {

            var index = 1;
            var rowIndex = 1;
            var worksheet = workbook.getWorksheet(1);

            var males = insertArray.filter(it => it.attributes["gender"] != null && it.attributes["gender"].toLowerCase() === 'm');
            var females = insertArray.filter(it => it.attributes["gender"] != null && it.attributes["gender"].toLowerCase() === 'f');

            var indexes = LoadWorkbookRows(males, worksheet, { "index": index, "rowIndex": rowIndex }, cogs_Data.filter(it => it.attributes["gender"] != null && it.attributes["gender"].toLowerCase() === 'm'));
            indexes = LoadWorkbookRows(females, worksheet, { "index": indexes.index, "rowIndex": indexes.rowIndex }, cogs_Data.filter(it => it.attributes["gender"] != null && it.attributes["gender"].toLowerCase() === 'f'));

            var wb = workbook.xlsx.writeFile(config.FILENAME).then(() => {
              fs.readFile(config.FILENAME, null, function (err, data) {

                var int8View = new Uint8Array(data);
                var array = [];
                var count = 0;
                var str = '';
                for (var attr in int8View) {
                  if (int8View.hasOwnProperty(attr)) {
                    array[count++] = int8View[attr];
                  }
                }

              //  uploadQuestionsData(array);
              });

            });
          });
      }).catch((err) => {
        writelog("error: " + err);
      })
    })
    .catch((err) => {
      writelog("error: " + err);
    })
}

function uploadQuestionsData(array) {

  writelog("Uploading questions");
  var body = {
    "quiz_id": config.QUIZ_ID,
    "app_id": config.APP_ID,
    "file": {
      "name": config.FILENAME,
      "type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      , "data": array
    }

  };

  axios.post(config.SPYD_IMPORT_QUESTIONS_API, body, { headers: { 'x-access-token': spyd_access_token, 'Content-Type': 'application/json' } })
    .then((result) => {
      writelog(result.data.results.messages);
      writelog("uploaded successfully");
    }).catch(err => {
      writelog("Error while upload questions");
      writelog(err);
    })
}


function getRandomSequence(min, max) {
  const random = uniqueRandom(min, max);
  var randomNumbers = [];

  do {
    randomNumbers = [];

    for (var i = 0; i < 4; i++) {
      randomNumbers.push(random());
    }
  }
  while (find_duplicate_in_array(randomNumbers).length > 0);
  return randomNumbers;
}

function getUniqueNames(fullname, lookupArray) {
  var names = [];

  do {
    var randomNumbers = getUniqueRandomNumbers(lookupArray.length - 1);
    names = [fullname, lookupArray[randomNumbers.Index1].attributes["full-name"]
      , lookupArray[randomNumbers.Index2].attributes["full-name"]
      , lookupArray[randomNumbers.Index3].attributes["full-name"]];
  }
  while (find_duplicate_in_array(names).length > 0);

  return names;
}

function find_duplicate_in_array(arra1) {
  var object = {};
  var result = [];

  arra1.forEach(function (item) {
    if (!object[item])
      object[item] = 0;
    object[item] += 1;
  })

  for (var prop in object) {
    if (object[prop] >= 2) {
      result.push(prop);
    }
  }

  return result;
}

function getUniqueRandomNumbers(len) {
  const random = uniqueRandom(1, len);
  var randomNumbers = { Index1: 0, Index2: 0, Index3: 0, Index4: 0 }

  do {
    randomNumbers.Index1 = random();
    randomNumbers.Index2 = random();
    randomNumbers.Index3 = random();
    randomNumbers.Index4 = random();
  }
  while (randomNumbers.Index1 === randomNumbers.Index2 || randomNumbers.Index1 === randomNumbers.Index3
  || randomNumbers.Index2 === randomNumbers.Index3 || randomNumbers.Index4 === randomNumbers.Index1 || randomNumbers.Index4 === randomNumbers.Index2
    || randomNumbers.Index4 === randomNumbers.Index3
  );

  return randomNumbers;
}

function writelog(log) {
  console.log(log);
  fs.appendFileSync("logs/" + new Date().toLocaleDateString() + ".txt", (new Date()).toLocaleString() + " >>>> ");
  fs.appendFileSync("logs/" + new Date().toLocaleDateString() + ".txt", log + " \r\n");
}