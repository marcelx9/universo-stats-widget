const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, "data");
const USERS_PATH = path.join(__dirname, "users.json");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

app.use(cors());
app.use(express.json({ limit: "10mb" }));

function getDataPath(userKey) {
    return path.join(DATA_DIR, `${userKey}.json`);
}

function readData(userKey) {
    if (!userKey) return {};

    const file = getDataPath(userKey);

    if (!fs.existsSync(file)) {
        return {};
    }

    return JSON.parse(fs.readFileSync(file, "utf8"));
}

function saveData(userKey, data) {
    fs.writeFileSync(getDataPath(userKey), JSON.stringify(data, null, 2));
}

function readUsers() {
    if (!fs.existsSync(USERS_PATH)) return {};
    return JSON.parse(fs.readFileSync(USERS_PATH, "utf8"));
}

function buildDiscordPayload(data) {
    const dynamic = [];

    if (data.skin_url) {
        dynamic.push({
            type: 3,
            name: "player_skin",
            value: {
                url: String(data.skin_url)
            }
        });
    }

    dynamic.push(
        { type: 1, name: "player_name", value: String(data.player_name || "") },
        { type: 1, name: "rank", value: String(data.rank || "") },
        { type: 1, name: "level", value: String(data.level || "") },
        { type: 1, name: "first_login", value: String(data.first_login || "") },
        { type: 1, name: "last_login", value: String(data.last_login || "") },
        { type: 1, name: "friends", value: String(data.friends || "") },
        { type: 1, name: "clan", value: String(data.clan || "") },
        { type: 1, name: "premium", value: String(data.premium || "") },
        { type: 1, name: "bedwars_wins", value: String(data.bedwars_wins || "") },
        { type: 1, name: "bedwars_kills", value: String(data.bedwars_kills || "") },
        { type: 1, name: "skywars", value: `${data.skywars_wins || ""}W / ${data.skywars_kills || ""}K` },
        { type: 1, name: "skypit", value: `Lv ${data.skypit_level || ""} / ${data.skypit_kills || ""}K / ${data.skypit_deaths || ""}D` }
    );

    return {
        data: {
            dynamic,
            primary: {
                rank: String(data.rank || "")
            }
        }
    };
}

app.get("/", (req, res) => {
    res.send("Widget UniversoCraft funcionando.");
});

app.get("/stats", (req, res) => {
    const userKey = req.query.userKey;

    if (!userKey) {
        return res.status(400).json({
            error: "Falta userKey. Usa /stats?userKey=tu-clave"
        });
    }

    res.json(readData(userKey));
});

app.get("/env-check", (req, res) => {
    res.json({
        DISCORD_APP_ID: !!process.env.DISCORD_APP_ID,
        DISCORD_BOT_TOKEN: !!process.env.DISCORD_BOT_TOKEN,
        WIDGET_KEY: !!process.env.WIDGET_KEY
    });
});

app.post("/admin/update", (req, res) => {
    if (req.headers["x-widget-key"] !== process.env.WIDGET_KEY) {
        return res.status(401).json({ error: "No autorizado" });
    }

    const users = readUsers();
    const userKey = req.body.user_key;
    const discordUserId = users[userKey];

    if (!discordUserId) {
        return res.status(401).json({ error: "Clave de widget inválida" });
    }

    const data = {
        ...req.body,
        discord_user_id: discordUserId
    };

    saveData(userKey, data);

    res.json({
        success: true,
        userKey,
        data
    });
});

app.get("/widget", (req, res) => {
    const userKey = req.query.userKey;

    if (!userKey) {
        return res.status(400).json({
            error: "Falta userKey. Usa /widget?userKey=tu-clave"
        });
    }

    const data = readData(userKey);
    res.json(buildDiscordPayload(data));
});

app.get("/update-widget", async (req, res) => {
    try {
        if (!process.env.DISCORD_APP_ID || !process.env.DISCORD_BOT_TOKEN) {
            throw new Error("Faltan variables de Discord");
        }

        const userKey = req.query.userKey;

        if (!userKey) {
            throw new Error("Falta userKey. Usa /update-widget?userKey=tu-clave");
        }

        const data = readData(userKey);

        if (!data.discord_user_id) {
            throw new Error("Falta discord_user_id. Actualiza primero desde la extensión con una clave válida.");
        }

        const payload = buildDiscordPayload(data);

        const url = `https://discord.com/api/v9/applications/${process.env.DISCORD_APP_ID}/users/${data.discord_user_id}/identities/0/profile`;

        const response = await axios.patch(url, payload, {
            headers: {
                Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        res.json({
            success: true,
            userKey,
            sent: payload,
            discord: response.data
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            discord: err.response?.data || err.message
        });
    }
});

app.get("/users-test", (req, res) => {
    res.json(readUsers());
});

app.listen(PORT, () => {
    console.log(`Servidor iniciado en puerto ${PORT}`);
});