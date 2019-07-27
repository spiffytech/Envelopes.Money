/* tslint:disable:no-var-requires */
require("dotenv").config();

import cookieSession from "cookie-session";
import cors from "cors";
import Debug from 'debug';
import express from "express";
import morgan from "morgan";
import * as path from "path";

import unauth from "./src/routes/unauth";
import * as sessions from "./src/lib/sessions";

if (!process.env.GRAPHQL_ENDPOINT) throw new Error("Missing GRAPHQL_ENDPOINT");
if (!process.env.COOKIE_SECRET) throw new Error("Missing COOKIE_SECRET");
if (!process.env.SCRYPT_SALT) throw new Error("Missing SCRYPT_SALT");

const debug = Debug('app');

const app = express();
app.use(morgan("combined"));
app.use(
  cors({
    origin: [/https?:\/\/localhost:.*/, /https?:\/\/penguin.linux.test:.*/],
    credentials: true
  })
);
app.use(
  cookieSession({
    name: "session",
    secret: process.env.COOKIE_SECRET,
    maxAge: 1000 * 86400 * 14,
    signed: false
  })
);

if (!process.env.POUCH_ONLY) {
  app.use("/", unauth);

  const authedRouter = express.Router();
  authedRouter.use(async (req, res, next) => {
    const apikey = sessions.apikeyFromRequest(req);
    if (!apikey) {
      res.statusCode = 401;
      console.log("No API key in request");
      return res.send({ error: "unauthorized" });
    }

    const session = await sessions.lookUpSession(apikey);
    if (!session) {
      res.statusCode = 401;
      console.error("No session for that API key");
      return res.send({ error: "unauthorized" });
    }

    req.userId = session.id;
    req.apikey = apikey;
    return next();
  });

  authedRouter.get("/credentials", (req, res) => {
    res.json({
      email: req.session!.credentials.email,
      password: req.session!.credentials.password,
      apikey: req.session!.credentials.apikey,
      userId: req.session!.credentials.userId
    });
  });

  app.use("/api", authedRouter);
} else {
  debug('Using PouchDB exclusively. No logins supported.');
}


// Serve static files for React
app.use(express.static(path.join(__dirname, "../../../client", "public")));
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../client", "public", "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Envelopes.Money is listening on port ${port}!`)
);
