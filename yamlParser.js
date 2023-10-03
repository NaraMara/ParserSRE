const YAML = require("yaml");
const fs = require("fs");
const { curly } = require("node-libcurl");
const querystring = require("querystring");
const[ , , filepath]= process.argv
console.log(filepath)
const file = fs.readFileSync(filepath, "utf8");
// ВНИМАНИЕ. Абсолютно каждый success ответ на post запрос валид код, тк node-libcurl не может обработать тело запроса.

const baseApiUrl = "http://158.160.113.69:8080/api/v0/";
let cookie = "-";
let token = "-";
//functions
async function createTeamRequest(team) {
  let teamObj = {
    name: team.name,
    email: team.email,
    scheduling_timezone: team.scheduling_timezone,
    slack_channel: team.slack_channel,
  };
  try {
    await curly.post(baseApiUrl + "teams/", {
      customRequest: "POST",
      httpHeader: [
        "x-csrf-token: " + token,
        "Content-Type: application/json",
        "Cookie: " + cookie,
      ],
      COOKIE: cookie,
      postFields: JSON.stringify(teamObj),
    });
  } catch (error) {}
}

async function login() {
  let response = await curly.post("http://158.160.113.69:8080/login", {
    customRequest: "POST",
    httpHeader: ["Content-Type: application/x-www-form-urlencoded"],
    postFields: querystring.stringify({
      username: "root",
      password: "123",
    }),
  });
  token = response["data"]["csrf_token"];
  cookie = response["headers"][0]["Set-Cookie"][0].split(";")[0];
}

async function createUser(user) {
  let userObj = {
    contacts: {
      call: user.phone_number,
      email: user.email,
    },
    name: user.name,
    full_name: user.full_name,
    active: 1,
  };
  try {
    await curly.post(baseApiUrl + "users/", {
      customRequest: "POST",
      httpHeader: [
        "x-csrf-token: " + token,
        "Content-Type: application/json",
        "Cookie: " + cookie,
      ],
      postFields: JSON.stringify({ name: user.name }),
    });
  } catch (error) {}

  try {
    await curly.put(baseApiUrl + "users/" + user.name, {
      customRequest: "PUT",
      httpHeader: [
        "x-csrf-token: " + token,
        "Content-Type: application/json",
        "Cookie: " + cookie,
      ],
      postFields: JSON.stringify(userObj),
    });
  } catch (error) {}

  // if (putResponse["statusCode"] === 404) {
  //   console.log("Unable to put data for. User not found. User:" + user.name);
  //   return putResponse["statusCode"];
  // }
  // if (putResponse["statusCode"] === 204) {
  //   console.log("User data has been successfully changed. User:", user);
  //   return putResponse["statusCode"];
  // }
  // return putResponse["statusCode"];
}
async function addUserToTeam(teamName, rosterName, username) {
  let url =
    baseApiUrl +
    "teams/" +
    encodeURI(teamName) +
    "/rosters/" +
    rosterName +
    "/users";
  try {
    await curly.post(url, {
      customRequest: "POST",
      httpHeader: [
        "x-csrf-token: " + token,
        "Content-Type: application/json",
        "Cookie: " + cookie,
      ],
      postFields: JSON.stringify({ name: username }),
    });
  } catch (error) {}
}

async function createRoster(teamName, rosterName = "Roster") {
  let url = baseApiUrl + "teams/" + encodeURI(teamName) + "/rosters";
  try {
    await curly.post(url, {
      customRequest: "POST",
      httpHeader: [
        "x-csrf-token: " + token,
        "Content-Type: application/json",
        "Cookie: " + cookie,
      ],
      postFields: JSON.stringify({ name: rosterName }),
    });
  } catch (error) {}
}
async function addDutyToUser(duty, username, teamName) {
  let date=duty.date.split("/")//день месяц год
  let startDate=new Date(date[2],date[1]-1,date[0])
  let endDate=new Date(date[2],date[1]-1,date[0])
  endDate.setDate(endDate.getDate()+1)
  let obj = {
    start: startDate.valueOf()/1000,
    end: endDate.valueOf()/1000,
    user: username,
    team: teamName,
    role: duty.role,
  };
  try {
     await curly.post(baseApiUrl + "events", {
      customRequest: "POST",
      httpHeader: [
        "x-csrf-token: " + token,
        "Content-Type: application/json",
        "Cookie: " + cookie,
      ],
      postFields: JSON.stringify(obj),
    });
  } catch (error) {}
}

async function main() {
  await login();
  const doc = YAML.parseDocument(file);
  let documentObj = doc.toJS();
  await documentObj["teams"].forEach(async (team) => {
    console.log("Creating team", team.name);
    await createTeamRequest(team);
    let rosterName = "Roster";
    console.log("create roster");
    await createRoster(team.name);
    await team["users"].forEach(async (user) => {
      console.log("Creating user", user);
      await createUser(user);
      console.log("adding user to team");
      await addUserToTeam(team.name, rosterName, user.name);
      await user["duty"].forEach(async (duty) => {
        await addDutyToUser(duty,user.name,team.name)
      });
    });
  });
}
main();
