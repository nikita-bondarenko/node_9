require("dotenv").config();
const cors = require("cors");
const express = require("express");
const crypto = require("crypto");

const { MongoClient, ObjectId } = require("mongodb");

const clientPromise = MongoClient.connect(process.env.DB_URI);

const app = express();
app.use(cors());
app.use(async (req, res, next) => {
  try {
    const client = await clientPromise;
    req.db = client.db("timers");
    next();
  } catch (err) {
    next(err);
  }
});

const findUserByUsername = async (db, username) => db.collection("users").findOne({ username });

const findUserBySessionId = async (db, sessionId) => {
  try {
    const session = await db
      .collection("sessions")
      .findOne({ _id: ObjectId(sessionId) }, { projection: { userId: 1 } });
    if (!session) {
      return;
    }
    return db.collection("users").findOne({ _id: ObjectId(session.userId) });
  } catch (err) {
    console.error(err);
  }
};

const findTimersByUserId = async (db, id) => {
  const timers = await db
    .collection("timers")
    .find({ userId: ObjectId(id) })
    .toArray();
  return timers;
};

const createSession = async (db, userId) => {
  const { insertedId } = await db.collection("sessions").insertOne({
    userId: ObjectId(userId),
  });
  return insertedId;
};

const createUser = async (db, { username, password }) => {
  const { insertedId } = await db.collection("users").insertOne({
    username,
    password,
  });
  return insertedId;
};

const createTimer = async (db, timer) => {
  const { insertedId } = await db.collection("timers").insertOne(timer);
  return insertedId;
};

const deleteSession = async (db, sessionId) => {
  await db.collection("sessions").deleteOne({ sessionId });
};

app.use(express.json());

const hash = (d) => crypto.createHash("sha512").update(d).digest("hex");

const auth = () => async (req, res, next) => {
  sessionId = req.query.sessionId;
  if (!sessionId) {
    return next();
  }
  const user = await findUserBySessionId(req.db, sessionId);
  req.user = user;
  req.sessionId = sessionId;
  next();
};

app.post("/login", async (req, res) => {
  const { password, username } = req.body;
  const pswhash = hash(password);
  const user = await findUserByUsername(req.db, username);
  if (!!user && user.password === pswhash) {
    const sessionId = await createSession(req.db, user._id);
    res.json({ sessionId });
  } else {
    res.json({ error: "Wrong username or password!" });
  }
});

app.post("/signup", async (req, res) => {
  const { password, username } = req.body;
  const user = await findUserByUsername(req.db, username);
  if (user) {
    res.json({ error: "The same username already exists!" });
    return;
  }
  const pswhash = hash(password);
  const body = { username, password: pswhash };
  const userId = await createUser(req.db, body);
  const sessionId = await createSession(req.db, userId);
  res.json({ sessionId });
});

app.get("/logout", auth(), async (req, res) => {
  if (!req.user) {
    res.json({});
  } else {
    await deleteSession(req.db, req.sessionId);
    res.json({});
  }
});

class Timer {
  constructor(req) {
    const description = req.body.description;
    const start = Date.now();
    const userId = ObjectId(req.user._id);
    return {
      userId,
      start,
      description,
      isActive: true,
    };
  }
}

async function isAuthorized(req) {
  const sessionId = req.query.sessionId;
  const user = await findUserBySessionId(req.db, sessionId);
  return sessionId && user;
}

app.post("/api/timers", auth(), async (req, res) => {
  const isAuth = await isAuthorized(req);
  if (!isAuth) {
    return res.sendStatus(401);
  }
  const timer = new Timer(req);
  const id = await createTimer(req.db, timer);
  res.json({ id }).status(201);
});

app.get("/api/timers", auth(), async (req, res) => {
  const isAuth = await isAuthorized(req);
  if (!isAuth) {
    return res.sendStatus(401);
  }
  const userId = req.user._id;

  const timers = await findTimersByUserId(req.db, userId);
  const now = Date.now();
  const soughtData = timers.reduce((arr, item) => {
    return String(item.isActive) === req.query.isActive
      ? [
          ...arr,
          {
            ...item,
            progress: now - item.start,
            _id: item._id.toString(),
            duration: item.end - item.start,
          },
        ]
      : arr;
  }, []);
  res.status(200).json(soughtData);
});

app.post("/api/timers/:id/stop", async (req, res) => {
  try {
    const isAuth = await isAuthorized(req);
    if (!isAuth) {
      return res.sendStatus(401);
    }
    const { acknowledged } = await req.db.collection("timers").updateOne(
      {
        _id: ObjectId(req.params.id),
      },
      {
        $set: { isActive: false, end: Date.now() },
      }
    );
    if (acknowledged) {
      res.sendStatus(204);
    } else {
      res.sendStatus(500);
    }
  } catch (err) {
    console.error(err);
  }
});

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
