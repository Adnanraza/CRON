var config = {};

// config.QUIZ_ID = "1912050716180324";
// config.APP_ID = "1711170454262827";

config.QUIZ_ID = "1912270326446240";
config.APP_ID = "1804201128427319";

// config.QUIZ_ID = "1912180231079455";
// config.APP_ID = "1804201128427319";
//config.COGS_API_BASE_URL = "http://10.0.0.159:1234"
config.SPYD_API_BASE_URL = "http://10.0.0.49:3002"

config.COGS_API_BASE_URL = "https://cogs.10pearls.com/cogsapi"
//config.SPYD_API_BASE_URL = "https://www.spydup.com/"

config.COGS_LOGIN_API = config.COGS_API_BASE_URL + "/api/auth/login"
config.COGS_CREDENTIALS = { Username: 'adnan.raza', Password: 'Adnan!@#123' }
config.COGS_GET_EMPLOYEESDATA_API = config.COGS_API_BASE_URL + "/api/employees/AllEmployeesCard?searchText=All&isName=true&hideProbationResources=true"
config.SPYD_AUTH_API = config.SPYD_API_BASE_URL + "/v2/oauth/local"
config.SPYD_GET_QUESTIONS_API = config.SPYD_API_BASE_URL + "/v2/quiz/" + config.QUIZ_ID + "/question?app_id=" + config.APP_ID + "&quiz_id=" + config.QUIZ_ID
config.SPYD_DELETE_QUESTION_API = config.SPYD_API_BASE_URL + "/v2/quiz/" + config.QUIZ_ID + "/question/"
config.SPYD_DELETE_BULK_QUESTION_API = config.SPYD_API_BASE_URL + "/v2/quiz/" + config.QUIZ_ID + "/questions/"
config.SPYD_IMPORT_QUESTIONS_API = config.SPYD_API_BASE_URL + "/v2/quiz/" + config.QUIZ_ID + "/import/"

config.QUESTION_TEXT = "What is the name of the employee?"
config.QUESTION_TYPE = "mcq"

config.TEMPLATE_FILENAME = "Template.xlsx"
config.FILENAME = "UploadQuestions.xlsx"

config.SPYD_AUTH_API_BODY = {
    "identifier": "portal",
    "key": "portal", "secret": "portal",
    "account_id": "admin@trivia.com",
    "password": "admin"

    // "account_id": "naureen.alam@tenpearls.com",
    // "password": "university10"
    
}
//naureen.alam@tenpearls.com/university10
// "account_id": "admin@trivia.com",
    // "password": "admin"
module.exports = config;