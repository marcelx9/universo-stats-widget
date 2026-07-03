const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, "data.json");

app.use(cors());
app.use(express.json({ limit: "10mb" }));

function readData() {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
}

function saveData(data) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function buildDiscordPayload(data) {
    return {
        data: {
            dynamic: [
                { type: 1, name: "player_name", value: String(data.player_name || "") },
                { type: 1, name: "rank", value: String(data.rank || "") },
                { type: 1, name: "level", value: String(data.level || "") },
                { type: 1, name: "first_login", value: String(data.first_login || "") },
                { type: 1, name: "last_login", value: String(data.last_login || "") },
                { type: 1, name: "friends", value: String(data.friends || "") },
                {
                    type: 3,
                    name: "player_skin",
                    value: {
                        url: String(data.skin_url || "")
                    }
                },
                { type: 1, name: "clan", value: String(data.clan || "") },
                { type: 1, name: "premium", value: String(data.premium || "") },
                { type: 1, name: "bedwars_wins", value: String(data.bedwars_wins || "") },
                { type: 1, name: "bedwars_kills", value: String(data.bedwars_kills || "") },
                { type: 1, name: "skywars", value: `${data.skywars_wins || ""}W / ${data.skywars_kills || ""}K` },
                { type: 1, name: "skypit", value: `Lv ${data.skypit_level || ""} / ${data.skypit_kills || ""}K / ${data.skypit_deaths || ""}D` }
            ],
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
    res.json(readData());
});

app.post("/admin/update", (req, res) => {
    if (req.query.key !== process.env.ADMIN_KEY) {
        return res.status(401).json({ error: "No autorizado" });
    }

    saveData(req.body);
    res.json({ success: true, data: req.body });
});

app.get("/widget", (req, res) => {
    const data = readData();
    res.json(buildDiscordPayload(data));
});

app.get("/update-widget", async (req, res) => {
    try {
        if (!process.env.DISCORD_APP_ID || !process.env.DISCORD_USER_ID || !process.env.DISCORD_BOT_TOKEN) {
            throw new Error("Faltan variables de Discord en Render");
        }

        const data = readData();
        const payload = buildDiscordPayload(data);

        const url = `https://discord.com/api/v9/applications/${process.env.DISCORD_APP_ID}/users/${process.env.DISCORD_USER_ID}/identities/0/profile`;

        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                Authorization: process.env.DISCORD_BOT_TOKEN.startsWith("Bot ")
                    ? process.env.DISCORD_BOT_TOKEN
                    : `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        res.json({
            success: response.ok,
            sent: payload,
            discord: result
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor iniciado en puerto ${PORT}`);

    app.get("/env-check", (req, res) => {
        res.json({
            DISCORD_APP_ID: !!process.env.DISCORD_APP_ID,
            DISCORD_USER_ID: !!process.env.DISCORD_USER_ID,
            DISCORD_BOT_TOKEN: !!process.env.DISCORD_BOT_TOKEN
        });
    });
});